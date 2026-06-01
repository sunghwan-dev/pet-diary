package com.petdiary.domain;

import com.petdiary.domain.enums.TodoFrequency;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "todos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Todo extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TodoFrequency frequency = TodoFrequency.NONE;

    private LocalTime targetTime; // 루틴 시간 (알람 기준 시간)

    private LocalDate dueDate; // 단발성 할 일인 경우 마감일

    @Builder.Default
    private Boolean isCompleted = false;

    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "todo", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AlarmConfig> alarmConfigs = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_id")
    private Medication medication;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_log_id")
    private MedicalLog medicalLog;

    public void toggleCompletion() {
        this.isCompleted = !this.isCompleted;
        this.completedAt = this.isCompleted ? LocalDateTime.now() : null;
    }

    public void update(String title, TodoFrequency frequency, LocalTime targetTime, LocalDate dueDate) {
        this.title = title;
        this.frequency = frequency;
        this.targetTime = targetTime;
        this.dueDate = dueDate;
    }
}
