import { apiClient } from './client';
import type { User } from '../types';

export type NewUser = Omit<User, 'id'> & { password?: string };

export const usersApi = {
  list: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },
  create: async (user: NewUser): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', user);
    return data;
  },
  update: async (id: string, fields: Partial<User>): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/users/${id}`, fields);
    return data;
  },
};
