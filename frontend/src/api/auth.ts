import client from './client';
import { LoginRequest, LoginResponse, UserRequest } from '../types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await client.post<LoginResponse>('/api/users/login', data);
    return response.data;
  },
  
  signUp: async (data: UserRequest): Promise<number> => {
    const response = await client.post<number>('/api/users/signup', data);
    return response.data;
  },
};
