import { api, API_ENDPOINTS } from '@/api/apiClient';

export const authService = {
  async requestCsrf(): Promise<string> {
    const data = await api.get(API_ENDPOINTS.AUTH.CSRF);
    return data.csrfToken;
  },

  async login(email: string, password: string): Promise<any> {
    const csrfToken = await this.requestCsrf();
    
    // Auth.js expects credentials as x-www-form-urlencoded
    const body = new URLSearchParams({
      email,
      password,
      csrfToken,
      redirect: 'false',
      json: 'true'
    });

    return api.post(API_ENDPOINTS.AUTH.CALLBACK, body, {
      redirect: 'manual'
    });
  },

  async register(username: string, email: string, password: string): Promise<any> {
    return api.post(API_ENDPOINTS.AUTH.REGISTER, { username, email, password });
  },

  async logout(): Promise<void> {
    const csrfToken = await this.requestCsrf();
    const body = new URLSearchParams({
      csrfToken,
      redirect: 'false',
      json: 'true'
    });
    await api.post(API_ENDPOINTS.AUTH.SIGNOUT, body);
  },

  async getSession(): Promise<any> {
    return api.get(API_ENDPOINTS.AUTH.SESSION);
  }
};
