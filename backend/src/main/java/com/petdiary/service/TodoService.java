package com.petdiary.service;

import com.petdiary.domain.*;
import com.petdiary.domain.enums.AlarmType;
import com.petdiary.dto.request.TodoRequestDto;
import com.petdiary.dto.response.TodoResponseDto;
import com.petdiary.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TodoService {

    private final TodoRepository todoRepository;
    private final PetRepository petRepository;
    private final AlarmConfigRepository alarmConfigRepository;

    @Transactional
    public Long createTodo(Long petId, TodoRequestDto requestDto) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new CustomException("Pet not found", HttpStatus.NOT_FOUND));

        Todo todo = Todo.builder()
                .pet(pet)
                .title(requestDto.getTitle())
                .frequency(requestDto.getFrequency())
                .targetTime(requestDto.getTargetTime())
                .dueDate(requestDto.getDueDate())
                .build();

        Todo savedTodo = todoRepository.save(todo);

        // 알람 설정 저장
        if (requestDto.getAlarmTypes() != null) {
            List<AlarmConfig> alarmConfigs = requestDto.getAlarmTypes().stream()
                    .map(type -> AlarmConfig.builder()
                            .todo(savedTodo)
                            .alarmType(type)
                            .isEnabled(true)
                            .build())
                    .collect(Collectors.toList());
            alarmConfigRepository.saveAll(alarmConfigs);
        }

        return savedTodo.getId();
    }

    @Transactional
    public void updateTodo(Long todoId, TodoRequestDto requestDto) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new CustomException("Todo not found", HttpStatus.NOT_FOUND));

        todo.update(
                requestDto.getTitle(),
                requestDto.getFrequency(),
                requestDto.getTargetTime(),
                requestDto.getDueDate()
        );

        if (requestDto.getAlarmTypes() != null) {
            todo.getAlarmConfigs().clear();
            List<AlarmConfig> alarmConfigs = requestDto.getAlarmTypes().stream()
                    .map(type -> AlarmConfig.builder()
                            .todo(todo)
                            .alarmType(type)
                            .isEnabled(true)
                            .build())
                    .collect(Collectors.toList());
            alarmConfigRepository.saveAll(alarmConfigs);
        }
    }

    @Transactional
    public void toggleTodoCompletion(Long todoId) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new CustomException("Todo not found", HttpStatus.NOT_FOUND));
        todo.toggleCompletion();
    }

    @Transactional
    public void deleteTodo(Long todoId) {
        if (!todoRepository.existsById(todoId)) {
            throw new CustomException("Todo not found", HttpStatus.NOT_FOUND);
        }
        todoRepository.deleteById(todoId);
    }

    public TodoResponseDto getTodo(Long todoId) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new CustomException("Todo not found", HttpStatus.NOT_FOUND));
        return convertToResponseDto(todo);
    }

    public List<TodoResponseDto> getPetTodos(Long petId) {
        // 실제 구현에서는 날짜별 필터링 등이 필요할 수 있음
        return todoRepository.findAll().stream() // 임시로 전체 조회, 실제로는 petId 필터 필요
                .filter(todo -> todo.getPet().getId().equals(petId))
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    private TodoResponseDto convertToResponseDto(Todo todo) {
        List<AlarmType> enabledAlarms = todo.getAlarmConfigs().stream()
                .filter(AlarmConfig::getIsEnabled)
                .map(AlarmConfig::getAlarmType)
                .collect(Collectors.toList());

        return TodoResponseDto.builder()
                .id(todo.getId())
                .title(todo.getTitle())
                .frequency(todo.getFrequency())
                .targetTime(todo.getTargetTime())
                .dueDate(todo.getDueDate())
                .isCompleted(todo.getIsCompleted())
                .completedAt(todo.getCompletedAt())
                .enabledAlarms(enabledAlarms)
                .build();
    }
}
