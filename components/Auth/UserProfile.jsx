'use client';

import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function UserProfile() {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center space-x-4">
        <Link 
          href="/login" 
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ログイン
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        {currentUser.photoURL && (
          <img
            src={currentUser.photoURL}
            alt="プロフィール"
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="text-sm font-medium text-gray-700">
          {currentUser.displayName || currentUser.email}
        </span>
      </div>
      
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ログアウト
      </button>
    </div>
  );
}