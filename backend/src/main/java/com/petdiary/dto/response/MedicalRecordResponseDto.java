package com.petdiary.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;

@Getter
@Builder
public class MedicalRecordResponseDto {
    private Long id;
    private Long petId;
    private String petName;
    private String type; // VACCINE, MEDICATION, TREATMENT, etc.
    private String title;
    private String reason; // diagnosis or medication description
    private LocalDate date;
    private LocalDate nextDueDate;
    private Integer cost;
    private String notes;
}
