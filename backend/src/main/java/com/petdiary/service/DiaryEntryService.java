package com.petdiary.service;

import com.petdiary.domain.DiaryEntry;
import com.petdiary.domain.DiaryEntryRepository;
import com.petdiary.domain.Pet;
import com.petdiary.domain.PetRepository;
import com.petdiary.dto.request.DiaryEntryRequestDto;
import com.petdiary.dto.response.DiaryEntryResponseDto;
import com.petdiary.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiaryEntryService {

    private final DiaryEntryRepository diaryEntryRepository;
    private final PetRepository petRepository;

    @Transactional
    public Long createDiaryEntry(Long petId, DiaryEntryRequestDto requestDto) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new CustomException("Pet not found", HttpStatus.NOT_FOUND));

        DiaryEntry diaryEntry = DiaryEntry.builder()
                .pet(pet)
                .photoUrl(requestDto.getPhotoUrl())
                .content(requestDto.getContent())
                .diaryDate(requestDto.getDiaryDate())
                .build();

        return diaryEntryRepository.save(diaryEntry).getId();
    }

    public List<DiaryEntryResponseDto> getPetDiaries(Long petId) {
        // 날짜 역순으로 조회하는 로직은 추후 Repository 메서드 확장을 통해 개선 가능
        return diaryEntryRepository.findAll().stream()
                .filter(diary -> diary.getPet().getId().equals(petId))
                .sorted((d1, d2) -> d2.getDiaryDate().compareTo(d1.getDiaryDate()))
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDiaryEntry(Long diaryId) {
        if (!diaryEntryRepository.existsById(diaryId)) {
            throw new CustomException("Diary entry not found", HttpStatus.NOT_FOUND);
        }
        diaryEntryRepository.deleteById(diaryId);
    }

    private DiaryEntryResponseDto convertToResponseDto(DiaryEntry diaryEntry) {
        return DiaryEntryResponseDto.builder()
                .id(diaryEntry.getId())
                .photoUrl(diaryEntry.getPhotoUrl())
                .content(diaryEntry.getContent())
                .diaryDate(diaryEntry.getDiaryDate())
                .build();
    }
}
