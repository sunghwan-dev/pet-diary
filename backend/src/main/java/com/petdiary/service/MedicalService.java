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
}
