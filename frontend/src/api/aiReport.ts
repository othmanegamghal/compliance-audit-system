import { apiClient } from './client';

export interface AIReport {
  auditId: string;
  generatedAt: string;
  model: string;
  executiveSummary: string;
  majorFindings: string[];
  recommendations: string[];
  conclusion: string;
}

export const aiReportApi = {
  get: async (auditId: string): Promise<AIReport | null> => {
    const { data } = await apiClient.get<AIReport | null>(`/reports/audits/${auditId}/ai`);
    return data;
  },
  generate: async (auditId: string): Promise<AIReport> => {
    const { data } = await apiClient.post<AIReport>(`/reports/audits/${auditId}/generate-ai`);
    return data;
  },
};
