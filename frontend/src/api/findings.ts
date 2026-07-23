import { apiClient } from './client';
import type { NonConformity, NonConformityStatus } from '../types';

export const findingsApi = {
  list: async (): Promise<NonConformity[]> => {
    const { data } = await apiClient.get<NonConformity[]>('/findings');
    return data;
  },
  updateStatus: async (
    id: string,
    status: NonConformityStatus,
    correctiveActionText?: string,
    correctiveActionDueDate?: string
  ): Promise<NonConformity> => {
    const { data } = await apiClient.patch<NonConformity>(`/findings/${id}`, {
      status,
      correctiveActionText,
      correctiveActionDueDate,
    });
    return data;
  },
};
