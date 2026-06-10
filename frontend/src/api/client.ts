import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import React from 'react';
import { NavigationContainerRef } from '@react-navigation/native';

// 전역 navigationRef – RootNavigator에 연결합니다.
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://dev-api.simba-noba.com';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 – 토큰 자동 삽입
client.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 – 자동 토큰 재발급 + 실패 시 로그인 화면 이동
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // === 에러 상세 디버깅 로그 추가 ===
    console.error('====== API CALL ERROR DETAIL ======');
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method?.toUpperCase());
    console.error('Headers:', JSON.stringify(error.config?.headers, null, 2));
    
    if (error.response) {
      // 서버가 2xx 범위를 벗어난 상태 코드로 응답한 경우
      console.error('Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // 요청이 전송되었으나 응답을 받지 못한 경우 (가장 흔한 네트워크 에러)
      console.error('Request Info (No Response):', JSON.stringify(error.request, null, 2));
      console.error('Error Code (Axios):', error.code);
      console.error('Error Message:', error.message);
    } else {
      // 요청 설정 중에 문제가 발생한 경우
      console.error('Error config setting message:', error.message);
    }
    console.error('===================================');

    const originalConfig = error.config;
    // 401 혹은 403 에러가 발생하고 아직 재시도하지 않았다면
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalConfig._retry
    ) {
      originalConfig._retry = true; // 무한 루프 방지

      try {
        // Refresh Token 요청 (백엔드 reissue 엔드포인트)
        const refreshResp = await axios.post(
          `${BASE_URL}/api/auth/reissue`,
          null,
          {
            params: { refreshToken: useAuthStore.getState().refreshToken },
          }
        );
        const { accessToken: newAccess, refreshToken: newRefresh } = refreshResp.data;

        // 스토어에 새 토큰 저장
        useAuthStore.getState().setTokens(newAccess, newRefresh);

        // 원래 요청에 새로운 토큰을 붙이고 재시도
        originalConfig.headers.Authorization = `Bearer ${newAccess}`;
        return client(originalConfig);
      } catch (refreshError) {
        // Refresh 실패 → 로그아웃하고 로그인 화면으로 이동
        useAuthStore.getState().logout();
        if (navigationRef.current?.navigate) {
          navigationRef.current.navigate('Login'); // 라우트 이름에 맞게 수정
        }
        return Promise.reject(refreshError);
      }
    }
    // 기타 에러는 그대로 전달
    return Promise.reject(error);
  }
);

export default client;
