import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

let accessToken: string | undefined;
let refreshToken: string | undefined;

export function setApiTokens(tokens: { accessToken: string; refreshToken: string }) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
}

export function clearApiTokens() {
  accessToken = undefined;
  refreshToken = undefined;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && refreshToken && !error.config.__isRetry) {
      try {
        const refreshResponse = await axios.post('/api/v1/auth/refresh', { refreshToken });
        accessToken = refreshResponse.data.accessToken;
        refreshToken = refreshResponse.data.refreshToken;
        error.config.__isRetry = true;
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        clearApiTokens();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
