package com.petdiary.dto.request;

import com.petdiary.domain.enums.AlarmType;
import com.petdiary.domain.enums.TodoFrequency;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@NoArgsConstructor
public class TodoRequestDto {
    private String title;
    private TodoFrequency frequency;
    private LocalTime targetTime;
    private LocalDate dueDate;
    private List<AlarmType> alarmTypes; // 선택한 알람 시간 리스트
    private Long medicationId;
    private Long medicalLogId;
}
