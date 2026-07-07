import { api } from '@/api/apiClient';

export const workspaceService = {
  async getWorkspaces(): Promise<any> {
    return api.get('/workspaces');
  }
};
