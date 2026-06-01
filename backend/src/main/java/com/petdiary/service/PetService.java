package com.petdiary.service;

import com.petdiary.domain.*;
import com.petdiary.dto.request.PetRequestDto;
import com.petdiary.dto.response.PetResponseDto;
import com.petdiary.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PetService {

    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final WeightLogRepository weightLogRepository;

    @Transactional
    public Long registerPet(Long userId, PetRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Pet pet = Pet.builder()
                .user(user)
                .name(requestDto.getName())
                .breed(requestDto.getBreed())
                .birthDate(requestDto.getBirthDate())
                .isNeutered(requestDto.getIsNeutered())
                .profileImageUrl(requestDto.getProfileImageUrl())
                .build();

        Pet savedPet = petRepository.save(pet);

        // 초기 몸무게가 있다면 WeightLog에 기록
        if (requestDto.getCurrentWeight() != null) {
            WeightLog weightLog = WeightLog.builder()
                    .pet(savedPet)
                    .weight(requestDto.getCurrentWeight())
                    .measuredAt(LocalDate.now())
                    .memo("초기 등록 시 측정")
                    .build();
            weightLogRepository.save(weightLog);
        }

        return savedPet.getId();
    }

    public List<PetResponseDto> getUserPets(Long userId) {
        return petRepository.findByUserId(userId).stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    public PetResponseDto getPetDetail(Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new CustomException("Pet not found", HttpStatus.NOT_FOUND));
        return convertToResponseDto(pet);
    }

    @Transactional
    public void deletePet(Long petId) {
        if (!petRepository.existsById(petId)) {
            throw new CustomException("Pet not found", HttpStatus.NOT_FOUND);
        }
        petRepository.deleteById(petId);
    }

    private PetResponseDto convertToResponseDto(Pet pet) {
        // 최신 몸무게 조회 (measuredAt 내림차순, id 내림차순)
        BigDecimal latestWeight = weightLogRepository.findByPetIdOrderByMeasuredAtDesc(pet.getId())
                .stream()
                .findFirst()
                .map(WeightLog::getWeight)
                .orElse(null);

        return PetResponseDto.builder()
                .id(pet.getId())
                .name(pet.getName())
                .breed(pet.getBreed())
                .birthDate(pet.getBirthDate())
                .isNeutered(pet.getIsNeutered())
                .profileImageUrl(pet.getProfileImageUrl())
                .latestWeight(latestWeight)
                .build();
    }
}
