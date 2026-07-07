import { api } from '@/api/apiClient';

export const friendService = {
  async getFriends(): Promise<any> {
    return api.get('/friends');
  },

  async getFriendRequests(): Promise<any> {
    return api.get('/friends/requests');
  },

  async sendFriendRequest(recipientId: string): Promise<any> {
    return api.post('/friends/request', { recipientId });
  },

  async respondFriendRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<any> {
    return api.post('/friends/respond', { requestId, status });
  },

  async getFriendshipStatus(userId: string): Promise<any> {
    return api.get(`/friends/status/${userId}`);
  },

  async removeFriend(requestId: string): Promise<any> {
    return api.delete(`/friends/request/${requestId}`);
  }
};
