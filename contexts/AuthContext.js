'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ログイン機能（メール・パスワード）
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // ユーザー登録機能
  const signup = async (email, password, displayName = '') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // プロフィールを更新
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      // Firestoreにユーザー情報を保存
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        displayName: displayName || '',
        createdAt: new Date(),
        preferences: {
          defaultBudget: 50000,
          preferredDuration: 3,
          interests: [],
          notifications: {
            email: true,
            push: false,
            marketing: false
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Googleログイン
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Firestoreにユーザー情報を保存（初回登録時）
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          createdAt: new Date(),
          preferences: {
            defaultBudget: 50000,
            preferredDuration: 3,
            interests: [],
            notifications: {
              email: true,
              push: false,
              marketing: false
            }
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  // プロフィール更新
  const updateUserProfile = async (updates) => {
    try {
      if (currentUser) {
        // Firebase Authのプロフィールを更新
        await updateProfile(currentUser, updates);
        
        // Firestoreのユーザードキュメントも更新
        await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // ユーザー設定の取得
  const getUserPreferences = async () => {
    try {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          return userDoc.data().preferences || {};
        }
      }
      return {};
    } catch (error) {
      console.error('Get preferences error:', error);
      return {};
    }
  };

  // ユーザー設定の更新
  const updateUserPreferences = async (preferences) => {
    try {
      if (currentUser) {
        await setDoc(doc(db, 'users', currentUser.uid), {
          preferences
        }, { merge: true });
      }
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  };

  // 旅行履歴の保存
  const saveTravelPlan = async (plan) => {
    try {
      if (currentUser) {
        const planId = plan.trip_id || `plan_${Date.now()}`;
        await setDoc(doc(db, 'users', currentUser.uid, 'travelPlans', planId), {
          ...plan,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return planId;
      }
    } catch (error) {
      console.error('Save travel plan error:', error);
      throw error;
    }
  };

  // ログアウト
  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    loginWithGoogle,
    updateUserProfile,
    getUserPreferences,
    updateUserPreferences,
    saveTravelPlan,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};