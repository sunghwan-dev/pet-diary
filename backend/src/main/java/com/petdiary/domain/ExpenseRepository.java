package com.petdiary.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    java.util.List<Expense> findByMedicalLogId(Long medicalLogId);
    java.util.List<Expense> findByMedicationId(Long medicationId);
    java.util.List<Expense> findByPetId(Long petId);
}
