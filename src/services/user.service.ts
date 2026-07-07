import { api, API_ENDPOINTS } from '@/api/apiClient';

export const userService = {
  async getProfile(): Promise<any> {
    return api.get(API_ENDPOINTS.USER.ME);
  },

  async updateProfile(updates: any): Promise<any> {
    return api.patch(API_ENDPOINTS.USER.ME, updates);
  },

  async searchUsers(): Promise<any> {
    return api.get('/users/search');
  },

  async getUserById(id: string): Promise<any> {
    return api.get(`/users/${id}`);
  },

  async getBlockedUsers(): Promise<any> {
    return api.get('/users/blocked/list');
  },

  async blockUser(targetUserId: string): Promise<any> {
    return api.post('/users/block', { targetUserId });
  },

  async unblockUser(targetUserId: string): Promise<any> {
    return api.post('/users/unblock', { targetUserId });
  },

  async reportUser(targetUserId: string, reason: string, messageId?: string): Promise<any> {
    return api.post('/users/report', { targetUserId, reason, messageId });
  }
};
