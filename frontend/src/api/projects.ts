import { apiClient } from './client';
import type { Project, Objective } from '../types';

export const projectsApi = {
  list: async (): Promise<Project[]> => (await apiClient.get<Project[]>('/projects')).data,
  create: async (payload: Omit<Project, 'id' | 'objectivesCount'>): Promise<Project> =>
    (await apiClient.post<Project>('/projects', payload)).data,
  update: async (id: string, payload: Partial<Project>): Promise<Project> =>
    (await apiClient.patch<Project>(`/projects/${id}`, payload)).data,
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
  listObjectives: async (projectId: string): Promise<Objective[]> =>
    (await apiClient.get<Objective[]>(`/projects/${projectId}/objectives`)).data,
  createObjective: async (
    projectId: string,
    payload: Omit<Objective, 'id' | 'projectId' | 'departmentId'>
  ): Promise<Objective> =>
    (await apiClient.post<Objective>(`/projects/${projectId}/objectives`, { ...payload, projectId })).data,
  removeObjective: async (objectiveId: string): Promise<void> => {
    await apiClient.delete(`/projects/objectives/${objectiveId}`);
  },
};
