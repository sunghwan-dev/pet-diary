package com.petdiary.dto.response;

import com.petdiary.domain.enums.AlarmType;
import com.petdiary.domain.enums.TodoFrequency;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter
@Builder
public class TodoResponseDto {
    private Long id;
    private String title;
    private TodoFrequency frequency;
    private LocalTime targetTime;
    private LocalDate dueDate;
    private Boolean isCompleted;
    private LocalDateTime completedAt;
    private List<AlarmType> enabledAlarms;
}
