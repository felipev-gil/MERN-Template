import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', withCredentials: true, timeout: 10000 });
export const errorMessage = error => error.response?.data?.message || 'Unable to reach the server. Please try again.';


let sessionEpoch = 0;
export function sessionChanged() { sessionEpoch++; }
api.interceptors.request.use(config => { config.sessionEpoch = sessionEpoch; return config; });
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && error.config?.sessionEpoch === sessionEpoch && !['/auth/login', '/auth/register', '/auth/me'].includes(error.config?.url)) window.dispatchEvent(new Event('session-expired'));
  return Promise.reject(error);
});
