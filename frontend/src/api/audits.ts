import { apiClient } from './client';
import type { Audit, AuditAnswer } from '../types';

export const auditsApi = {
  list: async (): Promise<Audit[]> => {
    const { data } = await apiClient.get<Audit[]>('/audits');
    return data;
  },
  get: async (id: string): Promise<Audit> => {
    const { data } = await apiClient.get<Audit>(`/audits/${id}`);
    return data;
  },
  create: async (audit: Omit<Audit, 'id' | 'createdAt' | 'score' | 'answers'>): Promise<Audit> => {
    const { data } = await apiClient.post<Audit>('/audits', audit);
    return data;
  },
  saveAnswers: async (auditId: string, answers: AuditAnswer[], isFinalSubmit = false): Promise<Audit> => {
    const { data } = await apiClient.put<Audit>(`/audits/${auditId}/answers`, {
      answers,
      isFinalSubmit,
    });
    return data;
  },
};
