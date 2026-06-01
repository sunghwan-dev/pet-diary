package com.petdiary.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class DiaryEntryResponseDto {
    private Long id;
    private String photoUrl;
    private String content;
    private LocalDate diaryDate;
}
