package com.petdiary.controller;

import com.petdiary.dto.request.LoginRequestDto;
import com.petdiary.dto.request.UserRequestDto;
import com.petdiary.dto.response.LoginResponseDto;
import com.petdiary.dto.response.UserResponseDto;
import com.petdiary.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<Long> signUp(@RequestBody UserRequestDto requestDto) {
        return ResponseEntity.ok(userService.signUp(requestDto));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto requestDto) {
        return ResponseEntity.ok(userService.login(requestDto));
    }

    @PostMapping("/reissue")
    public ResponseEntity<LoginResponseDto> reissue(@RequestParam String refreshToken) {
        return ResponseEntity.ok(userService.reissue(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestParam Long userId) {
        userService.logout(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponseDto> getUserProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok().build();
    }
}
