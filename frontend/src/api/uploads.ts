import { apiClient } from './client';

export interface UploadResult {
  fileName: string;
  url: string;
}

export const uploadsApi = {
  upload: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<UploadResult>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
