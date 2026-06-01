package com.petdiary.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalLogRepository extends JpaRepository<MedicalLog, Long> {
}
