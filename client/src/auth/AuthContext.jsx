import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchCurrentUser, loginAccount, logoutAccount, signupAccount } from '../services/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authVersion = useRef(0);
  useEffect(() => {
    let active = true;
    const version = authVersion.current;
    fetchCurrentUser().then((current) => { if (active && authVersion.current === version) setUser(current); })
      .catch(() => { if (active && authVersion.current === version) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const value = useMemo(() => ({
    user, loading,
    async login(credentials) { const version = ++authVersion.current; const result = await loginAccount(credentials); if (authVersion.current === version) setUser(result.user); return result.user; },
    async signup(details) { const version = ++authVersion.current; const result = await signupAccount(details); if (authVersion.current === version) setUser(result.user); return result.user; },
    async logout() { ++authVersion.current; try { await logoutAccount(); } finally { setUser(null); } },
    setUser
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
