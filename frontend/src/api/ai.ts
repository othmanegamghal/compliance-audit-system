import { apiClient } from './client';

export interface ChecklistDraft {
  name: string;
  description: string;
  questions: { text: string; category: string }[];
}

export interface SuggestedAction {
  action: string;
  dueDate: string;
}

export const aiApi = {
  generateChecklist: async (topic: string, count = 8): Promise<ChecklistDraft> => {
    const { data } = await apiClient.post<ChecklistDraft>('/templates/ai-draft', { topic, count });
    return data;
  },
  suggestAction: async (findingId: string): Promise<SuggestedAction> => {
    const { data } = await apiClient.post<SuggestedAction>(`/findings/${findingId}/suggest-action`);
    return data;
  },
  ask: async (question: string): Promise<string> => {
    const { data } = await apiClient.post<{ answer: string }>('/assistant/ask', { question });
    return data.answer;
  },
};
