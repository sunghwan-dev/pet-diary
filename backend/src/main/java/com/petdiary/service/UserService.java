package com.petdiary.service;

import com.petdiary.domain.RefreshToken;
import com.petdiary.domain.RefreshTokenRepository;
import com.petdiary.domain.User;
import com.petdiary.domain.UserRepository;
import com.petdiary.dto.request.LoginRequestDto;
import com.petdiary.dto.request.UserRequestDto;
import com.petdiary.dto.response.LoginResponseDto;
import com.petdiary.dto.response.UserResponseDto;
import com.petdiary.exception.CustomException;
import com.petdiary.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public Long signUp(UserRequestDto requestDto) {
        if (userRepository.findByEmail(requestDto.getEmail()).isPresent()) {
            throw new CustomException("Email already exists", HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
                .email(requestDto.getEmail())
                .password(passwordEncoder.encode(requestDto.getPassword()))
                .nickname(requestDto.getNickname())
                .build();

        return userRepository.save(user).getId();
    }

    @Transactional
    public LoginResponseDto login(LoginRequestDto requestDto) {
        User user = userRepository.findByEmail(requestDto.getEmail())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            throw new CustomException("Invalid password", HttpStatus.UNAUTHORIZED);
        }

        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId(), user.getEmail(), user.getRole().name());

        // Refresh Token 저장 또는 업데이트
        refreshTokenRepository.findByUserId(user.getId())
                .ifPresentOrElse(
                        rt -> rt.updateToken(refreshToken),
                        () -> refreshTokenRepository.save(RefreshToken.builder()
                                .user(user)
                                .token(refreshToken)
                                .build())
                );

        return LoginResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public LoginResponseDto reissue(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new CustomException("Invalid Refresh Token", HttpStatus.UNAUTHORIZED);
        }

        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new CustomException("Token not found", HttpStatus.UNAUTHORIZED));

        User user = storedToken.getUser();

        String newAccessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getId(), user.getEmail(), user.getRole().name());

        storedToken.updateToken(newRefreshToken);

        return LoginResponseDto.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    public UserResponseDto getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        return convertToResponseDto(user);
    }

    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new CustomException("User not found", HttpStatus.NOT_FOUND);
        }
        userRepository.deleteById(userId);
    }

    private UserResponseDto convertToResponseDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .build();
    }
}
