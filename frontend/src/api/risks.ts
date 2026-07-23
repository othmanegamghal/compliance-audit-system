import { apiClient } from './client';
import type { Risk, MitigationPlan } from '../types';

export const risksApi = {
  list: async (): Promise<Risk[]> => (await apiClient.get<Risk[]>('/risks')).data,
  create: async (payload: {
    nonConformityId: string;
    name?: string;
    description?: string;
    impact: number;
    probability: number;
    status?: string;
  }): Promise<Risk> => (await apiClient.post<Risk>('/risks', payload)).data,
  update: async (id: string, payload: Partial<{ name: string; description: string; impact: number; probability: number; status: string }>): Promise<Risk> =>
    (await apiClient.patch<Risk>(`/risks/${id}`, payload)).data,
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/risks/${id}`);
  },
  listMitigations: async (riskId: string): Promise<MitigationPlan[]> =>
    (await apiClient.get<MitigationPlan[]>(`/risks/${riskId}/mitigations`)).data,
  createMitigation: async (riskId: string, payload: { description: string; dueDate?: string; status?: string }): Promise<MitigationPlan> =>
    (await apiClient.post<MitigationPlan>(`/risks/${riskId}/mitigations`, { ...payload, riskId })).data,
};
