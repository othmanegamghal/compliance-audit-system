import { apiClient } from './client';
import type { ReferenceDocument } from '../types';

export const documentsApi = {
  list: async (): Promise<ReferenceDocument[]> => (await apiClient.get<ReferenceDocument[]>('/documents')).data,
  create: async (payload: Omit<ReferenceDocument, 'id'>): Promise<ReferenceDocument> =>
    (await apiClient.post<ReferenceDocument>('/documents', payload)).data,
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },
};
