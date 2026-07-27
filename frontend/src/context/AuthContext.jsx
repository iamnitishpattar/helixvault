import { createContext, useState, useEffect, use, useMemo, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Ensure all axios requests send cookies
axios.defaults.withCredentials = true;

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => use(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const initAuth = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
        if (!ignore) setUser(res.data);
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    initAuth();
    return () => { ignore = true; };
  }, []);

  const login = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`);
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout, loading }), [user, login, logout, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
