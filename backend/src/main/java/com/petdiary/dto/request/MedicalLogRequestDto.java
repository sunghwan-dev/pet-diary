package com.petdiary.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class MedicalLogRequestDto {
    private LocalDate visitDate;
    private String purpose;
    private String diagnosis;
    private String vetNotes;
    private LocalDate nextVisitDate;
    private BigDecimal weightAtVisit;
    private Integer expenseAmount; // 진료비 (입력 시 가계부 자동 생성용)
}
