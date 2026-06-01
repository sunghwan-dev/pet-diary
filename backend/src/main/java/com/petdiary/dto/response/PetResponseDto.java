package com.petdiary.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class PetResponseDto {
    private Long id;
    private String name;
    private String breed;
    private LocalDate birthDate;
    private Boolean isNeutered;
    private String profileImageUrl;
    private BigDecimal latestWeight; // WeightLog에서 가져온 최신값
}
