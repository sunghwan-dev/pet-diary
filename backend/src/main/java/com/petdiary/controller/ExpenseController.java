package com.petdiary.controller;

import com.petdiary.dto.request.ExpenseRequestDto;
import com.petdiary.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<Long> recordExpense(@RequestParam Long petId, @RequestBody ExpenseRequestDto requestDto) {
        return ResponseEntity.ok(expenseService.recordExpense(petId, requestDto));
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long expenseId) {
        expenseService.deleteExpense(expenseId);
        return ResponseEntity.ok().build();
    }
}
