import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// 실제 폰에서 접속하기 위해 localhost 대신 컴퓨터의 로컬 IP를 사용합니다.
const BASE_URL = 'http://192.168.0.11:28080';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 모든 요청에 토큰 주입
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

// 응답 인터셉터: 토큰 만료 처리 등
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // TODO: 401 에러 발생 시 Refresh Token으로 재발급 로직 추가 예정
    return Promise.reject(error);
  }
);

export default client;
