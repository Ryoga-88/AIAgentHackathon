'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/Auth/LoginForm';

export default function LoginPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (currentUser) {
      // リダイレクト先を取得（デフォルトは /plans）
      const redirectTo = searchParams.get('redirect') || '/plans';
      router.push(redirectTo);
    }
  }, [currentUser, router, searchParams]);

  if (currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            旅行プランナー
          </h1>
          <p className="text-gray-600 mb-8">
            アカウントにログインして、あなたの旅行プランを作成しましょう
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}