import { api } from '@/api/apiClient';

export const chatService = {
  async getMessageHistory(targetId: string): Promise<any> {
    return api.get(`/chat/${targetId}`);
  },

  async deleteMessage(messageId: string): Promise<any> {
    return api.delete(`/chat/${messageId}`);
  },

  async getConversationList(): Promise<any> {
    return api.get('/chat/conversations/list');
  },

  async getSharedMedia(userId: string): Promise<any> {
    return api.get(`/chat/${userId}/media`);
  },

  async replyToMessage(messageId: string, replyData: any): Promise<any> {
    return api.post(`/chat/${messageId}/reply`, replyData);
  },

  async getReplyContext(messageId: string): Promise<any> {
    return api.get(`/chat/${messageId}/reply`);
  },

  async searchMessages(query: string): Promise<any> {
    return api.get(`/chat/search/query?q=${encodeURIComponent(query)}`);
  },

  async scrapeLinkPreview(url: string): Promise<any> {
    return api.get(`/chat/link-preview/scraper?url=${encodeURIComponent(url)}`);
  },

  async markAsRead(messageId: string): Promise<any> {
    return api.post(`/chat/${messageId}/read`);
  }
};
