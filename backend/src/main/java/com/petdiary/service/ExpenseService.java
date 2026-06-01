package com.petdiary.service;

import com.petdiary.domain.*;
import com.petdiary.dto.request.ExpenseRequestDto;
import com.petdiary.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final PetRepository petRepository;
    private final MedicalLogRepository medicalLogRepository;
    private final MedicationRepository medicationRepository;

    @Transactional
    public Long recordExpense(Long petId, ExpenseRequestDto requestDto) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new CustomException("Pet not found", HttpStatus.NOT_FOUND));

        MedicalLog medicalLog = null;
        if (requestDto.getMedicalLogId() != null) {
            medicalLog = medicalLogRepository.findById(requestDto.getMedicalLogId())
                    .orElseThrow(() -> new CustomException("Medical log not found", HttpStatus.NOT_FOUND));
        }

        Medication medication = null;
        if (requestDto.getMedicationId() != null) {
            medication = medicationRepository.findById(requestDto.getMedicationId())
                    .orElseThrow(() -> new CustomException("Medication not found", HttpStatus.NOT_FOUND));
        }

        Expense expense = Expense.builder()
                .pet(pet)
                .category(requestDto.getCategory())
                .amount(requestDto.getAmount())
                .expenseDate(requestDto.getExpenseDate())
                .memo(requestDto.getMemo())
                .medicalLog(medicalLog)
                .medication(medication)
                .build();

        return expenseRepository.save(expense).getId();
    }

    @Transactional
    public void deleteExpense(Long expenseId) {
        if (!expenseRepository.existsById(expenseId)) {
            throw new CustomException("Expense not found", HttpStatus.NOT_FOUND);
        }
        expenseRepository.deleteById(expenseId);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.petdiary.dto.response.ExpenseResponseDto> getPetExpenses(Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new CustomException("Pet not found", HttpStatus.NOT_FOUND));

        return expenseRepository.findByPetId(petId).stream()
                .map(exp -> com.petdiary.dto.response.ExpenseResponseDto.builder()
                        .id(exp.getId())
                        .petId(pet.getId())
                        .petName(pet.getName())
                        .category(exp.getCategory())
                        .amount(exp.getAmount())
                        .expenseDate(exp.getExpenseDate())
                        .memo(exp.getMemo())
                        .medicalLogId(exp.getMedicalLog() != null ? exp.getMedicalLog().getId() : null)
                        .medicationId(exp.getMedication() != null ? exp.getMedication().getId() : null)
                        .build())
                .sorted((a, b) -> b.getExpenseDate().compareTo(a.getExpenseDate()))
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void updateExpense(Long expenseId, ExpenseRequestDto requestDto) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new CustomException("Expense not found", HttpStatus.NOT_FOUND));

        Expense updated = Expense.builder()
                .id(expense.getId())
                .pet(expense.getPet())
                .category(requestDto.getCategory())
                .amount(requestDto.getAmount())
                .expenseDate(requestDto.getExpenseDate())
                .memo(requestDto.getMemo())
                .medicalLog(expense.getMedicalLog())
                .medication(expense.getMedication())
                .build();

        expenseRepository.save(updated);
    }
}
