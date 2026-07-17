import { fetchExpress, EXPRESS_API_URL } from './client';

export const workspaceService = {
  async create(name: string, iconUrl?: string | null) {
    return await fetchExpress('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, iconUrl })
    });
  },

  async list() {
    return await fetchExpress('/workspaces');
  }
};

export const messageService = {
  async sendChannelMessage(channelId: string, content: string, replyToId?: string) {
    return await fetchExpress('/messages/channel', {
      method: 'POST',
      body: JSON.stringify({ channelId, content, replyToId })
    });
  },

  async sendDM(recipientId: string, content: string, replyToId?: string) {
    return await fetchExpress('/messages/dm', {
      method: 'POST',
      body: JSON.stringify({ recipientId, content, replyToId })
    });
  }
};

export const friendService = {
  async sendRequest(targetTag: string) {
    return await fetchExpress('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ targetTag })
    });
  },

  async getFriends() {
    return await fetchExpress('/friends');
  }
};

export const storageService = {
  async uploadMedia(file: File, folder: 'avatars' | 'banners' | 'backgrounds' | 'workspace-icons' | 'stories' | 'attachments' | 'voice-notes') {
    const formData = new FormData();
    const isUserPhoto = folder === 'avatars' || folder === 'banners';
    formData.append(
      folder === 'avatars' ? 'avatar' : folder === 'banners' ? 'banner' : 'file',
      file
    );

    const url = isUserPhoto
      ? `${EXPRESS_API_URL}${folder === 'avatars' ? '/users/avatar' : '/users/banner'}`
      : `${EXPRESS_API_URL}/media/upload?folder=${folder}`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed.');
    }
    return data.data; // contains standard upload response envelope (url, publicId, size, extension)
  }
};
