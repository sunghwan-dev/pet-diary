package com.petdiary.domain;

import com.petdiary.domain.enums.AlarmType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "alarm_configs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AlarmConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "todo_id", nullable = false)
    private Todo todo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlarmType alarmType;

    @Builder.Default
    private Boolean isEnabled = true;
}
