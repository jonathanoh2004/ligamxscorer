import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signIn, signOut, signUp, fetchAuthSession } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const current = await getCurrentUser();
      const session = await fetchAuthSession();
      const groups = session.tokens?.idToken?.payload?.['cognito:groups'] || [];
      setUser(current);
      setIsAdmin(groups.includes('admin'));
    } catch {
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    await signIn({ username, password });
    await checkUser();
  }

  async function register(username, password) {
    return await signUp({
      username,
      password,
      options: { userAttributes: {} },
    });
  }

  async function logout() {
    await signOut();
    setUser(null);
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
