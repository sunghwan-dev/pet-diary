package com.petdiary.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class DiaryEntryRequestDto {
    private String photoUrl;
    private String content;
    private LocalDate diaryDate;
}
