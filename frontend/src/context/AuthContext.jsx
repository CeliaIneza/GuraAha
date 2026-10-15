import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import {
  REFRESH_KEY,
  clearSession,
  getStoredUser,
  refreshSession,
  setSession,
} from '../api/client';

const AuthContext = createContext(null);

function jwtRole(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem('guraaha_access_token');
      if (!token) {
        setReady(true);
        return;
      }

      try {
        const { data } = await authApi.me();
        setSession({ user: data });
        setUser(data);

        if (data.role !== jwtRole(token)) {
          const refreshed = await refreshSession();
          setUser(refreshed.user);
        }
      } catch {
        try {
          const refreshed = await refreshSession();
          setUser(refreshed.user);
        } catch {
          clearSession();
          setUser(null);
        }
      } finally {
        setReady(true);
      }
    };

    boot();
  }, []);

  const applyAuthData = (data) => {
    setSession(data);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    return applyAuthData(data);
  };

  const login = async (payload) => {
    const { data } = await authApi.login(payload);
    return applyAuthData(data);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // still clear local session
    }
    clearSession();
    setUser(null);
  };

  const syncRole = useCallback(async () => {
    const { data } = await authApi.me();
    setSession({ user: data });
    const token = localStorage.getItem('guraaha_access_token');
    if (data.role !== jwtRole(token)) {
      const refreshed = await refreshSession();
      setUser(refreshed.user);
      return refreshed.user;
    }
    setUser(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, register, login, logout, syncRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
