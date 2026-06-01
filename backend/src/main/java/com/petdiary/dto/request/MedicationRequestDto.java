package com.petdiary.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class MedicationRequestDto {
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer expenseAmount; // 약값 (입력 시 가계부 자동 생성용)
}
