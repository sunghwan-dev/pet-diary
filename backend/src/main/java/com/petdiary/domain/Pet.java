package com.petdiary.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Pet extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    private String breed;

    private LocalDate birthDate;

    private Boolean isNeutered;

    private String profileImageUrl;

    private String petType;

    private String petTheme;

    private String gender;

    private String coatColor;

    private String allergies;

    private LocalDate adoptionDate;

    private String microchipNumber;

    @Column(length = 1000)
    private String notes;

    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WeightLog> weightLogs = new ArrayList<>();

    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MedicalLog> medicalLogs = new ArrayList<>();

    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Medication> medications = new ArrayList<>();

    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Expense> expenses = new ArrayList<>();

    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Todo> todos = new ArrayList<>();

    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DiaryEntry> diaries = new ArrayList<>();

    public void update(String name, String breed, LocalDate birthDate, Boolean isNeutered, String profileImageUrl,
                       String petType, String petTheme, String gender, String coatColor, String allergies,
                       LocalDate adoptionDate, String microchipNumber, String notes) {
        this.name = name;
        this.breed = breed;
        this.birthDate = birthDate;
        this.isNeutered = isNeutered;
        this.profileImageUrl = profileImageUrl;
        this.petType = petType;
        this.petTheme = petTheme;
        this.gender = gender;
        this.coatColor = coatColor;
        this.allergies = allergies;
        this.adoptionDate = adoptionDate;
        this.microchipNumber = microchipNumber;
        this.notes = notes;
    }
}
