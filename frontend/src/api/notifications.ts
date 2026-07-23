import { apiClient } from './client';
import type { Notification } from '../types';

export const notificationsApi = {
  listMine: async (): Promise<Notification[]> => {
    const { data } = await apiClient.get<Notification[]>('/notifications/me');
    return data;
  },
  markRead: async (id: string): Promise<Notification> => {
    const { data } = await apiClient.patch<Notification>(`/notifications/${id}/read`);
    return data;
  },
  markAllRead: async (): Promise<Notification[]> => {
    const { data } = await apiClient.patch<Notification[]>('/notifications/read-all');
    return data;
  },
};
