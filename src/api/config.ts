const rawApiUrl = import.meta.env.VITE_API_URL || '/api';

export const config = {
  apiUrl: rawApiUrl,
  socketUrl: rawApiUrl.endsWith('/api') ? rawApiUrl.replace(/\/api$/, '') : rawApiUrl
};
