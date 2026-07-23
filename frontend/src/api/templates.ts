import { apiClient } from './client';
import type { ChecklistTemplate } from '../types';

export const templatesApi = {
  list: async (): Promise<ChecklistTemplate[]> => {
    const { data } = await apiClient.get<ChecklistTemplate[]>('/templates');
    return data;
  },
  create: async (template: Omit<ChecklistTemplate, 'id' | 'createdAt'>): Promise<ChecklistTemplate> => {
    const { data } = await apiClient.post<ChecklistTemplate>('/templates', template);
    return data;
  },
};
