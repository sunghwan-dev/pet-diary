package com.petdiary.controller;

import com.petdiary.dto.request.DiaryEntryRequestDto;
import com.petdiary.dto.response.DiaryEntryResponseDto;
import com.petdiary.service.DiaryEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diaries")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryEntryService diaryEntryService;

    @PostMapping
    public ResponseEntity<Long> createDiaryEntry(@RequestParam Long petId, @RequestBody DiaryEntryRequestDto requestDto) {
        return ResponseEntity.ok(diaryEntryService.createDiaryEntry(petId, requestDto));
    }

    @GetMapping
    public ResponseEntity<List<DiaryEntryResponseDto>> getPetDiaries(@RequestParam Long petId) {
        return ResponseEntity.ok(diaryEntryService.getPetDiaries(petId));
    }

    @DeleteMapping("/{diaryId}")
    public ResponseEntity<Void> deleteDiaryEntry(@PathVariable Long diaryId) {
        diaryEntryService.deleteDiaryEntry(diaryId);
        return ResponseEntity.ok().build();
    }
}
