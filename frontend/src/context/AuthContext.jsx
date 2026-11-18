import { createContext, useState, useEffect, use, useMemo, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Ensure all axios requests send credentials/cookies
axios.defaults.withCredentials = true;

// Configure global Authorization header interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => use(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('helixvault_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    return !!token;
  });

  const fetchUser = useCallback(async (tokenOverride) => {
    const token = tokenOverride || localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) {
      setUser(null);
      localStorage.removeItem('helixvault_user');
      setLoading(false);
      return null;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      localStorage.setItem('helixvault_user', JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('helixvault_user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Graceful timeout so user isn't stuck if Render backend is waking up
    const timeout = setTimeout(() => {
      if (!ignore) setLoading(false);
    }, 6000);

    const initAuth = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!ignore) {
          setUser(res.data);
          localStorage.setItem('helixvault_user', JSON.stringify(res.data));
        }
      } catch (err) {
        if (!ignore && err.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('token');
          localStorage.removeItem('helixvault_user');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    initAuth();
    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, []);

  const login = useCallback(async (token, userData) => {
    if (token) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    if (userData) {
      setUser(userData);
      localStorage.setItem('helixvault_user', JSON.stringify(userData));
    }
    return await fetchUser(token);
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`);
    } catch {
      // ignore
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('helixvault_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout, loading, fetchUser }), [user, login, logout, loading, fetchUser]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
