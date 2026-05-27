import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import translations from '../i18n/translations';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'uz');
  const [loading, setLoading] = useState(true);

  const t = (key) => translations[lang]?.[key] || translations.uz[key] || key;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const r = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  const can = (action) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'editor') return ['view','create','edit'].includes(action);
    if (user.role === 'viewer') return action === 'view';
    return false;
  };

  return (
    <AppContext.Provider value={{ user, login, logout, lang, changeLang, t, loading, can }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
