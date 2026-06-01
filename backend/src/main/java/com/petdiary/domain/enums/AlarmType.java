package com.petdiary.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AlarmType {
    TEN_MIN_BEFORE("10분 전"),
    THIRTY_MIN_BEFORE("30분 전"),
    ONE_HOUR_BEFORE("1시간 전"),
    ONE_DAY_BEFORE("1일 전"),
    ONE_WEEK_BEFORE("1주 전");

    private final String description;
}
