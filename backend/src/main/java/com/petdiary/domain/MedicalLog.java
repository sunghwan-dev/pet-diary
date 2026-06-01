package com.petdiary.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "medical_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MedicalLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Column(nullable = false)
    private LocalDate visitDate;

    @Column(nullable = false)
    private String purpose;

    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String vetNotes;

    private LocalDate nextVisitDate;

    @Column(precision = 5, scale = 2)
    private BigDecimal weightAtVisit;
}
