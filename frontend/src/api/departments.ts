import { apiClient } from './client';
import type { Department } from '../types';

export const departmentsApi = {
  list: async (): Promise<Department[]> => {
    const { data } = await apiClient.get<Department[]>('/departments');
    return data;
  },
  create: async (dept: Omit<Department, 'id' | 'complianceRate'>): Promise<Department> => {
    const { data } = await apiClient.post<Department>('/departments', dept);
    return data;
  },
};
