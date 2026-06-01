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
}
