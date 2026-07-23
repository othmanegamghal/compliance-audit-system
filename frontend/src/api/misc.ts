import { apiClient } from './client';
import type { Category, Comment, HistoryEntry, Kpis } from '../types';

export const categoriesApi = {
  list: async (): Promise<Category[]> => (await apiClient.get<Category[]>('/categories')).data,
  create: async (payload: { name: string; description?: string }): Promise<Category> =>
    (await apiClient.post<Category>('/categories', payload)).data,
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};

export const commentsApi = {
  list: async (params: { auditId?: string; findingId?: string }): Promise<Comment[]> =>
    (await apiClient.get<Comment[]>('/comments', { params })).data,
  create: async (payload: { auditId?: string; findingId?: string; content: string }): Promise<Comment> =>
    (await apiClient.post<Comment>('/comments', payload)).data,
};

export const historyApi = {
  list: async (): Promise<HistoryEntry[]> => (await apiClient.get<HistoryEntry[]>('/history')).data,
};

export const statsApi = {
  kpis: async (): Promise<Kpis> => (await apiClient.get<Kpis>('/stats/kpis')).data,
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Downloads use the token via a blob request so the browser saves the file.
async function downloadBlob(path: string, filename: string) {
  const { data } = await apiClient.get(path, { responseType: 'blob' });
  const url = window.URL.createObjectURL(data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const reportsApi = {
  auditPdf: (auditId: string) => downloadBlob(`/reports/audits/${auditId}/pdf`, `audit_${auditId}_report.pdf`),
  auditsCsv: () => downloadBlob('/reports/audits/csv', 'audits_export.csv'),
  findingsCsv: () => downloadBlob('/reports/findings/csv', 'findings_export.csv'),
  apiBase: API_BASE,
};
