package com.petdiary.controller;

import com.petdiary.dto.request.TodoRequestDto;
import com.petdiary.dto.response.TodoResponseDto;
import com.petdiary.service.TodoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    @PostMapping
    public ResponseEntity<Long> createTodo(@RequestParam Long petId, @RequestBody TodoRequestDto requestDto) {
        return ResponseEntity.ok(todoService.createTodo(petId, requestDto));
    }

    @GetMapping
    public ResponseEntity<List<TodoResponseDto>> getPetTodos(@RequestParam Long petId) {
        return ResponseEntity.ok(todoService.getPetTodos(petId));
    }

    @PatchMapping("/{todoId}/toggle")
    public ResponseEntity<Void> toggleTodo(@PathVariable Long todoId) {
        todoService.toggleTodoCompletion(todoId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{todoId}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long todoId) {
        todoService.deleteTodo(todoId);
        return ResponseEntity.ok().build();
    }
}
