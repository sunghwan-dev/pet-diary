package com.petdiary.controller;

import com.petdiary.dto.request.PetRequestDto;
import com.petdiary.dto.response.PetResponseDto;
import com.petdiary.service.PetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    @PostMapping
    public ResponseEntity<Long> registerPet(@RequestParam Long userId, @RequestBody PetRequestDto requestDto) {
        Long petId = petService.registerPet(userId, requestDto);
        return ResponseEntity.ok(petId);
    }

    @GetMapping
    public ResponseEntity<List<PetResponseDto>> getUserPets(@RequestParam Long userId) {
        return ResponseEntity.ok(petService.getUserPets(userId));
    }

    @GetMapping("/{petId}")
    public ResponseEntity<PetResponseDto> getPetDetail(@PathVariable Long petId) {
        return ResponseEntity.ok(petService.getPetDetail(petId));
    }

    @DeleteMapping("/{petId}")
    public ResponseEntity<Void> deletePet(@PathVariable Long petId) {
        petService.deletePet(petId);
        return ResponseEntity.ok().build();
    }
}
