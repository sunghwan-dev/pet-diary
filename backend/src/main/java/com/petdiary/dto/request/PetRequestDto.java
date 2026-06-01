package com.petdiary.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class PetRequestDto {
    private String name;
    private String breed;
    private LocalDate birthDate;
    private Boolean isNeutered;
    private BigDecimal currentWeight; // 초기 등록 시 몸무게
    private String profileImageUrl;
}
