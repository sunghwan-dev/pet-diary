package com.petdiary.service;

import com.petdiary.domain.*;
import com.petdiary.dto.request.MedicalLogRequestDto;
import com.petdiary.dto.request.MedicationRequestDto;
import com.petdiary.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedicalService {

    private final MedicalLogRepository medicalLogRepository;
    private final MedicationRepository medicationRepository;
    private final PetRepository petRepository;
    private final ExpenseRepository expenseRepository;
    private final WeightLogRepository weightLogRepository;

    @Transactional
    public Long recordMedicalLog(Long petId, MedicalLogRequestDto requestDto) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new CustomException("Pet not found", HttpStatus.NOT_FOUND));

        MedicalLog medicalLog = MedicalLog.builder()
                .pet(pet)
                .visitDate(requestDto.getVisitDate())
                .purpose(requestDto.getPurpose())
                .diagnosis(requestDto.getDiagnosis())
                .vetNotes(requestDto.getVetNotes())
                .nextVisitDate(requestDto.getNextVisitDate())
                .weightAtVisit(requestDto.getWeightAtVisit())
                .build();

        MedicalLog savedLog = medicalLogRepository.save(medicalLog);

        // 진료 시 몸무게를 쟀다면 WeightLog에도 자동 추가
        if (requestDto.getWeightAtVisit() != null) {
            WeightLog weightLog = WeightLog.builder()
                    .pet(pet)
                    .weight(requestDto.getWeightAtVisit())
                    .measuredAt(requestDto.getVisitDate())
                    .memo("병원 진료 시 측정")
                    .build();
            weightLogRepository.save(weightLog);
        }

        // 진료비가 입력되었다면 가계부에 자동 추가
        if (requestDto.getExpenseAmount() != null && requestDto.getExpenseAmount() > 0) {
            Expense expense = Expense.builder()
                    .pet(pet)
                    .category("MEDICAL")
                    .amount(requestDto.getExpenseAmount())
                    .expenseDate(requestDto.getVisitDate())
                    .medicalLog(savedLog)
                    .memo(requestDto.getPurpose() + " - 진료비")
                    .build();
            expenseRepository.save(expense);
        }

        return savedLog.getId();
    }

    @Transactional
    public Long recordMedication(Long petId, MedicationRequestDto requestDto) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new CustomException("Pet not found", HttpStatus.NOT_FOUND));

        Medication medication = Medication.builder()
                .pet(pet)
                .name(requestDto.getName())
                .startDate(requestDto.getStartDate())
                .endDate(requestDto.getEndDate())
                .isActive(true)
                .build();

        Medication savedMedication = medicationRepository.save(medication);

        // 약값이 입력되었다면 가계부에 자동 추가
        if (requestDto.getExpenseAmount() != null && requestDto.getExpenseAmount() > 0) {
            Expense expense = Expense.builder()
                    .pet(pet)
                    .category("MEDICAL")
                    .amount(requestDto.getExpenseAmount())
                    .expenseDate(requestDto.getStartDate())
                    .medication(savedMedication)
                    .memo(requestDto.getName() + " - 약값")
                    .build();
            expenseRepository.save(expense);
        }

        return savedMedication.getId();
    }

    @Transactional
    public void deleteMedicalLog(Long logId) {
        if (!medicalLogRepository.existsById(logId)) {
            throw new CustomException("Medical log not found", HttpStatus.NOT_FOUND);
        }
        medicalLogRepository.deleteById(logId);
    }

    @Transactional
    public void deleteMedication(Long medicationId) {
        if (!medicationRepository.existsById(medicationId)) {
            throw new CustomException("Medication not found", HttpStatus.NOT_FOUND);
        }
        medicationRepository.deleteById(medicationId);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.petdiary.dto.response.MedicalRecordResponseDto> getPetMedicalRecords(Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new CustomException("Pet not found", HttpStatus.NOT_FOUND));

        java.util.List<com.petdiary.dto.response.MedicalRecordResponseDto> list = new java.util.ArrayList<>();

        // Add MedicalLogs
        for (MedicalLog log : pet.getMedicalLogs()) {
            String type = "OTHER";
            String title = log.getPurpose();
            if (log.getPurpose() != null && log.getPurpose().contains(" - ")) {
                String[] parts = log.getPurpose().split(" - ", 2);
                String typeLabel = parts[0];
                title = parts[1];
                
                if ("예방접종".equals(typeLabel)) type = "VACCINE";
                else if ("투약".equals(typeLabel)) type = "MEDICATION";
                else if ("진료".equals(typeLabel)) type = "TREATMENT";
                else if ("수술".equals(typeLabel)) type = "SURGERY";
                else if ("검진".equals(typeLabel)) type = "CHECKUP";
                else if ("검사".equals(typeLabel)) type = "EXAM";
                else if ("알레르기".equals(typeLabel)) type = "ALLERGY";
                else if ("질환".equals(typeLabel)) type = "CONDITION";
            }

            java.util.List<Expense> exps = expenseRepository.findByMedicalLogId(log.getId());
            Integer expense = exps != null && !exps.isEmpty()
                    ? exps.get(0).getAmount()
                    : null;

            list.add(com.petdiary.dto.response.MedicalRecordResponseDto.builder()
                    .id(log.getId())
                    .petId(pet.getId())
                    .petName(pet.getName())
                    .type(type)
                    .title(title)
                    .reason(log.getDiagnosis())
                    .date(log.getVisitDate())
                    .nextDueDate(log.getNextVisitDate())
                    .cost(expense)
                    .notes(log.getVetNotes())
                    .build());
        }

        // Add Medications
        for (Medication med : pet.getMedications()) {
            String title = med.getName();
            String reason = "";
            if (med.getName() != null && med.getName().contains(" (") && med.getName().endsWith(")")) {
                int idx = med.getName().lastIndexOf(" (");
                title = med.getName().substring(0, idx);
                reason = med.getName().substring(idx + 2, med.getName().length() - 1);
            }

            java.util.List<Expense> exps = expenseRepository.findByMedicationId(med.getId());
            Integer expense = exps != null && !exps.isEmpty()
                    ? exps.get(0).getAmount()
                    : null;

            list.add(com.petdiary.dto.response.MedicalRecordResponseDto.builder()
                    .id(med.getId())
                    .petId(pet.getId())
                    .petName(pet.getName())
                    .type("MEDICATION")
                    .title(title)
                    .reason(reason)
                    .date(med.getStartDate())
                    .nextDueDate(med.getEndDate())
                    .cost(expense)
                    .notes("")
                    .build());
        }

        // Sort by date descending
        list.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return list;
    }

    @Transactional
    public void updateMedicalRecord(Long recordId, String recordType, MedicalLogRequestDto requestDto) {
        if ("MEDICATION".equals(recordType)) {
            Medication med = medicationRepository.findById(recordId)
                    .orElseThrow(() -> new CustomException("Medication not found", HttpStatus.NOT_FOUND));
            
            // Medication update
            String fullName = requestDto.getDiagnosis() != null && !requestDto.getDiagnosis().isEmpty()
                    ? requestDto.getPurpose() + " (" + requestDto.getDiagnosis() + ")"
                    : requestDto.getPurpose();
            
            Medication updatedMed = Medication.builder()
                    .id(med.getId())
                    .pet(med.getPet())
                    .name(fullName)
                    .startDate(requestDto.getVisitDate())
                    .endDate(requestDto.getNextVisitDate())
                    .isActive(true)
                    .build();
            medicationRepository.save(updatedMed);

            // Update Expense if exists
            java.util.List<Expense> exps = expenseRepository.findByMedicationId(med.getId());
            if (exps != null && !exps.isEmpty()) {
                Expense exp = exps.get(0);
                if (requestDto.getExpenseAmount() != null && requestDto.getExpenseAmount() > 0) {
                    Expense updatedExp = Expense.builder()
                            .id(exp.getId())
                            .pet(med.getPet())
                            .category("MEDICAL")
                            .amount(requestDto.getExpenseAmount())
                            .expenseDate(requestDto.getVisitDate())
                            .medication(updatedMed)
                            .memo(fullName + " - 약값")
                            .build();
                    expenseRepository.save(updatedExp);
                } else {
                    expenseRepository.delete(exp);
                }
            } else if (requestDto.getExpenseAmount() != null && requestDto.getExpenseAmount() > 0) {
                Expense exp = Expense.builder()
                        .pet(med.getPet())
                        .category("MEDICAL")
                        .amount(requestDto.getExpenseAmount())
                        .expenseDate(requestDto.getVisitDate())
                        .medication(updatedMed)
                        .memo(fullName + " - 약값")
                        .build();
                expenseRepository.save(exp);
            }
        } else {
            MedicalLog log = medicalLogRepository.findById(recordId)
                    .orElseThrow(() -> new CustomException("Medical log not found", HttpStatus.NOT_FOUND));

            MedicalLog updatedLog = MedicalLog.builder()
                    .id(log.getId())
                    .pet(log.getPet())
                    .visitDate(requestDto.getVisitDate())
                    .purpose(requestDto.getPurpose())
                    .diagnosis(requestDto.getDiagnosis())
                    .vetNotes(requestDto.getVetNotes())
                    .nextVisitDate(requestDto.getNextVisitDate())
                    .weightAtVisit(requestDto.getWeightAtVisit())
                    .build();
            medicalLogRepository.save(updatedLog);

            // Update WeightLog if exists or add
            if (requestDto.getWeightAtVisit() != null) {
                WeightLog wlog = weightLogRepository.findByPetIdOrderByMeasuredAtDesc(log.getPet().getId())
                        .stream()
                        .filter(w -> w.getMeasuredAt().equals(log.getVisitDate()) && "병원 진료 시 측정".equals(w.getMemo()))
                        .findFirst()
                        .orElse(null);
                
                if (wlog != null) {
                    WeightLog updatedW = WeightLog.builder()
                            .id(wlog.getId())
                            .pet(log.getPet())
                            .weight(requestDto.getWeightAtVisit())
                            .measuredAt(requestDto.getVisitDate())
                            .memo("병원 진료 시 측정")
                            .build();
                    weightLogRepository.save(updatedW);
                } else {
                    WeightLog weightLog = WeightLog.builder()
                            .pet(log.getPet())
                            .weight(requestDto.getWeightAtVisit())
                            .measuredAt(requestDto.getVisitDate())
                            .memo("병원 진료 시 측정")
                            .build();
                    weightLogRepository.save(weightLog);
                }
            }

            // Update Expense if exists
            java.util.List<Expense> exps = expenseRepository.findByMedicalLogId(log.getId());
            if (exps != null && !exps.isEmpty()) {
                Expense exp = exps.get(0);
                if (requestDto.getExpenseAmount() != null && requestDto.getExpenseAmount() > 0) {
                    Expense updatedExp = Expense.builder()
                            .id(exp.getId())
                            .pet(log.getPet())
                            .category("MEDICAL")
                            .amount(requestDto.getExpenseAmount())
                            .expenseDate(requestDto.getVisitDate())
                            .medicalLog(updatedLog)
                            .memo(requestDto.getPurpose() + " - 진료비")
                            .build();
                    expenseRepository.save(updatedExp);
                } else {
                    expenseRepository.delete(exp);
                }
            } else if (requestDto.getExpenseAmount() != null && requestDto.getExpenseAmount() > 0) {
                Expense exp = Expense.builder()
                        .pet(log.getPet())
                        .category("MEDICAL")
                        .amount(requestDto.getExpenseAmount())
                        .expenseDate(requestDto.getVisitDate())
                        .medicalLog(updatedLog)
                        .memo(requestDto.getPurpose() + " - 진료비")
                        .build();
                expenseRepository.save(exp);
            }
        }
    }
}
