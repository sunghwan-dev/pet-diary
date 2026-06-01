package com.petdiary.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WeightLogRepository extends JpaRepository<WeightLog, Long> {
    List<WeightLog> findByPetIdOrderByMeasuredAtDesc(Long petId);
}
