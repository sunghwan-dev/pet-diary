package com.petdiary.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;

@Getter
@Builder
public class ExpenseResponseDto {
    private Long id;
    private Long petId;
    private String petName;
    private String category;
    private Integer amount;
    private LocalDate expenseDate;
    private String memo;
    private Long medicalLogId;
    private Long medicationId;
}
