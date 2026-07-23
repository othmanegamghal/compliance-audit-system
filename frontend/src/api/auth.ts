import { apiClient } from './client';
import type { User } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterOptions {
  departments: { id: string; name: string }[];
  roles: string[];
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  departmentId: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },
  registerOptions: async (): Promise<RegisterOptions> => {
    const { data } = await apiClient.get<RegisterOptions>('/auth/register-options');
    return data;
  },
  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', payload);
    return data;
  },
};
