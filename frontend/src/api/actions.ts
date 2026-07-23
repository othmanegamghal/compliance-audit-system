import { apiClient } from './client';
import type { CorrectiveAction, CorrectiveActionStatus } from '../types';

export const actionsApi = {
  list: async (): Promise<CorrectiveAction[]> => {
    const { data } = await apiClient.get<CorrectiveAction[]>('/actions');
    return data;
  },
  create: async (action: Omit<CorrectiveAction, 'id'>): Promise<CorrectiveAction> => {
    const { data } = await apiClient.post<CorrectiveAction>('/actions', action);
    return data;
  },
  updateStatus: async (id: string, status: CorrectiveActionStatus): Promise<CorrectiveAction> => {
    const { data } = await apiClient.patch<CorrectiveAction>(`/actions/${id}`, { status });
    return data;
  },
};
