"use client";
import { useRouter, usePathname } from "next/navigation";

export default function BlurredContent({ children, isAuthenticated, title = "詳細を表示" }) {
  const router = useRouter();
  const pathname = usePathname();

  if (isAuthenticated) {
    return children;
  }

  const handleLoginClick = () => {
    // 現在のパスをリダイレクト先として指定
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  };

  return (
    <div className="relative">
      {/* モザイク効果のコンテンツ */}
      <div className="filter blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white/95 flex items-start justify-center pt-16">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md text-center border border-gray-200 backdrop-blur-sm">
          <div className="text-5xl mb-6">🔒</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {title}を見るにはログインが必要です
          </h3>
          <p className="text-gray-600 mb-8 text-sm leading-relaxed">
            ログインして完全なプランの詳細、ホテル情報、ルート詳細を確認しましょう
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleLoginClick}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center text-lg"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              ログインして詳細を見る
            </button>
            
            <div className="text-xs text-gray-500 py-2">
              プラン生成は無料でご利用いただけます
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
