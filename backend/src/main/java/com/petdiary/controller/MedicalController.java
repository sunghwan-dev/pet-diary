package com.petdiary.controller;

import com.petdiary.dto.request.MedicalLogRequestDto;
import com.petdiary.dto.request.MedicationRequestDto;
import com.petdiary.service.MedicalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/medical")
@RequiredArgsConstructor
public class MedicalController {

    private final MedicalService medicalService;

    @PostMapping("/logs")
    public ResponseEntity<Long> recordMedicalLog(@RequestParam Long petId, @RequestBody MedicalLogRequestDto requestDto) {
        return ResponseEntity.ok(medicalService.recordMedicalLog(petId, requestDto));
    }

    @PostMapping("/medications")
    public ResponseEntity<Long> recordMedication(@RequestParam Long petId, @RequestBody MedicationRequestDto requestDto) {
        return ResponseEntity.ok(medicalService.recordMedication(petId, requestDto));
    }

    @DeleteMapping("/logs/{logId}")
    public ResponseEntity<Void> deleteMedicalLog(@PathVariable Long logId) {
        medicalService.deleteMedicalLog(logId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/medications/{medicationId}")
    public ResponseEntity<Void> deleteMedication(@PathVariable Long medicationId) {
        medicalService.deleteMedication(medicationId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/records")
    public ResponseEntity<java.util.List<com.petdiary.dto.response.MedicalRecordResponseDto>> getPetMedicalRecords(@RequestParam Long petId) {
        return ResponseEntity.ok(medicalService.getPetMedicalRecords(petId));
    }

    @PutMapping("/records/{recordId}")
    public ResponseEntity<Void> updateMedicalRecord(
            @PathVariable Long recordId,
            @RequestParam String recordType,
            @RequestBody MedicalLogRequestDto requestDto) {
        medicalService.updateMedicalRecord(recordId, recordType, requestDto);
        return ResponseEntity.ok().build();
    }
}
