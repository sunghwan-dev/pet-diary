import { components } from "./schema";

// 백엔드 DTO와 1:1 매칭되는 타입들을 편하게 쓰기 위해 재정의
export type UserResponse = components["schemas"]["UserResponseDto"];
export type UserRequest = components["schemas"]["UserRequestDto"];

export type PetResponse = components["schemas"]["PetResponseDto"];
export type PetRequest = components["schemas"]["PetRequestDto"];

export type TodoResponse = components["schemas"]["TodoResponseDto"];
export type TodoRequest = components["schemas"]["TodoRequestDto"];

export type MedicalLogRequest = components["schemas"]["MedicalLogRequestDto"];
export type MedicationRequest = components["schemas"]["MedicationRequestDto"];
export type ExpenseRequest = components["schemas"]["ExpenseRequestDto"];
export type DiaryEntryRequest = components["schemas"]["DiaryEntryRequestDto"];
export type DiaryEntryResponse = components["schemas"]["DiaryEntryResponseDto"];

export type LoginRequest = components["schemas"]["LoginRequestDto"];
export type LoginResponse = components["schemas"]["LoginResponseDto"];

// Enum 타입들도 스키마에서 추출
export type TodoFrequency =
  components["schemas"]["TodoRequestDto"]["frequency"];
