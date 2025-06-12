'use client';

import { createContext, useContext, useState } from 'react';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  // デモ用のユーザーデータ
  const [currentUser] = useState({
    uid: 'demo-user-123',
    email: 'demo@example.com',
    displayName: 'デモユーザー',
    photoURL: 'https://via.placeholder.com/40',
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    }
  });
  const [loading] = useState(false);

  // ダミー関数（実際の実装では Firebase の認証機能を使用）
  const login = async (email, password) => {
    console.log('Login attempt:', { email, password });
    return Promise.resolve();
  };

  const signup = async (email, password) => {
    console.log('Signup attempt:', { email, password });
    return Promise.resolve();
  };

  const loginWithGoogle = async () => {
    console.log('Google login attempt');
    return Promise.resolve();
  };

  const logout = async () => {
    console.log('Logout attempt');
    return Promise.resolve();
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
