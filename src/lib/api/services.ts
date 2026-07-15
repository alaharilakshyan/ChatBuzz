import { BACKEND_PROVIDER, fetchExpress } from './client';
import { createBrowserClient } from '@/utils/supabase/client';

export const authService = {
  async register(email: string, password: string, username: string) {
    if (BACKEND_PROVIDER === 'express') {
      const data = await fetchExpress('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, username })
      });
      localStorage.setItem('chatbuzz_token', data.token);
      return data.user;
    } else {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data.user;
    }
  },

  async login(email: string, password: string) {
    if (BACKEND_PROVIDER === 'express') {
      const data = await fetchExpress('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('chatbuzz_token', data.token);
      return data.user;
    } else {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    }
  },

  async logout() {
    if (BACKEND_PROVIDER === 'express') {
      localStorage.removeItem('chatbuzz_token');
    } else {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    }
  }
};

export const workspaceService = {
  async create(name: string, iconUrl?: string | null) {
    if (BACKEND_PROVIDER === 'express') {
      return await fetchExpress('/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name, iconUrl })
      });
    } else {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.from('workspaces').insert([{ name, icon_url: iconUrl }]).select().single();
      if (error) throw error;
      return data;
    }
  },

  async list() {
    if (BACKEND_PROVIDER === 'express') {
      return await fetchExpress('/workspaces');
    } else {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.from('workspaces').select('*');
      if (error) throw error;
      return data;
    }
  }
};

export const messageService = {
  async sendChannelMessage(channelId: string, content: string, replyToId?: string) {
    if (BACKEND_PROVIDER === 'express') {
      return await fetchExpress('/messages/channel', {
        method: 'POST',
        body: JSON.stringify({ channelId, content, replyToId })
      });
    } else {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.from('messages').insert([{ channel_id: channelId, content, reply_to_id: replyToId }]).select().single();
      if (error) throw error;
      return data;
    }
  },

  async sendDM(recipientId: string, content: string, replyToId?: string) {
    if (BACKEND_PROVIDER === 'express') {
      return await fetchExpress('/messages/dm', {
        method: 'POST',
        body: JSON.stringify({ recipientId, content, replyToId })
      });
    } else {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.from('messages').insert([{ recipient_id: recipientId, content, reply_to_id: replyToId }]).select().single();
      if (error) throw error;
      return data;
    }
  }
};

export const friendService = {
  async sendRequest(targetTag: string) {
    if (BACKEND_PROVIDER === 'express') {
      return await fetchExpress('/friends/request', {
        method: 'POST',
        body: JSON.stringify({ targetTag })
      });
    } else {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.rpc('send_friend_request_by_tag', { target_tag: targetTag });
      if (error) throw error;
      return data;
    }
  },

  async getFriends() {
    if (BACKEND_PROVIDER === 'express') {
      return await fetchExpress('/friends');
    } else {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.from('friendships').select('*');
      if (error) throw error;
      return data;
    }
  }
};
