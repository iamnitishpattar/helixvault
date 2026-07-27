const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://helixvault.onrender.com';
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = getBaseUrl();
