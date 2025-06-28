"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMockSchedule } from "../../data/mockData";

export default function ConfirmPage() {
  const router = useRouter();
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [planWithDates, setPlanWithDates] = useState(null);
  const plan = getMockSchedule();

  useEffect(() => {
    // ローカルストレージから日程付きプランデータを取得
    const storedPlanWithDates = localStorage.getItem('selectedPlanWithDates');
    if (storedPlanWithDates) {
      setPlanWithDates(JSON.parse(storedPlanWithDates));
    }
  }, []);

  // 共有リンクをコピーする機能
  const handleCopyShareLink = async () => {
    const currentUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(currentUrl);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error("コピーに失敗しました:", err);
      // フォールバック: テキストを選択状態にする
      const textArea = document.createElement("textarea");
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
      } catch (fallbackError) {
        console.error("フォールバックも失敗しました:", fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleNewPlan = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            旅行プランが確定しました！
          </h1>
          <p className="text-xl text-green-100">
            素晴らしい旅になりそうですね。準備を始めましょう！
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Plan Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.hero.title}</h2>
            <p className="text-lg text-gray-600">{plan.hero.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">📍</div>
              <div className="font-semibold text-gray-900">目的地</div>
              <div className="text-gray-600">{plan.hero.destination}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">📅</div>
              <div className="font-semibold text-gray-900">期間</div>
              {planWithDates?.travel_dates ? (
                <div className="text-gray-600">
                  <div className="text-sm">
                    {new Date(planWithDates.travel_dates.start).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric'
                    })} - {new Date(planWithDates.travel_dates.end).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.ceil((new Date(planWithDates.travel_dates.end) - new Date(planWithDates.travel_dates.start)) / (1000 * 60 * 60 * 24))}日間
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">
                  <div className="font-medium">
                    {plan.hero.duration}
                  </div>
                  {plan.itinerary && plan.itinerary.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {plan.itinerary.length}日間のプラン
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold text-gray-900">予算</div>
              <div className="text-gray-600">{plan.hero.budget}</div>
            </div>
          </div>

          {/* 具体的な日程表示 */}
          {planWithDates?.travel_dates && (planWithDates.travel_dates.startDate || planWithDates.travel_dates.start) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🗓️</span>
                確定した旅行日程
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">出発日</div>
                  <div className="text-lg font-semibold text-blue-700">
                    {new Date(planWithDates.travel_dates.startDate || planWithDates.travel_dates.start).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">帰着日</div>
                  <div className="text-lg font-semibold text-blue-700">
                    {new Date(planWithDates.travel_dates.endDate || planWithDates.travel_dates.end).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg lg:col-span-1 sm:col-span-2">
                  <div className="text-sm text-gray-600 mb-1">旅行期間</div>
                  <div className="text-lg font-semibold text-green-700">
                    {planWithDates.travel_dates.duration || (() => {
                      const start = new Date(planWithDates.travel_dates.startDate || planWithDates.travel_dates.start);
                      const end = new Date(planWithDates.travel_dates.endDate || planWithDates.travel_dates.end);
                      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                      return `${days}日間`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Itinerary */}
          <div className="border-t pt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">旅程概要</h3>
            <div className="space-y-4">
              {plan.itinerary.map((day) => (
                <div key={day.day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-blue-700">Day {day.day}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{day.city.name}</div>
                    <div className="text-gray-600">{day.activities.length}個のアクティビティ</div>
                  </div>
                  <div className="text-gray-400">
                    {day.activities.map(() => "📍").join(" ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🔗</span>
            プランを共有
          </h3>
          
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-600 text-lg mb-6">
              確定したプランを家族や友人と共有して、一緒に旅行の準備を進めましょう！
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">共有でできること</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  詳細な旅程の確認
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  予算と費用の確認
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  地図での位置確認
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  活動の詳細情報
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={handleCopyShareLink}
              className="w-full bg-gradient-to-r from-green-600 to-teal-700 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
            >
              <svg
                className="w-6 h-6 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              <span>共有リンクをコピー</span>
            </button>
            {showCopySuccess && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-lg">
                ✅ リンクをコピーしました！
              </div>
            )}
          </div>
        </div>

        {/* Booking Reminders */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">予約チェックリスト</h3>
          
          <div className="space-y-4">
            {[
              { icon: '🏨', title: '宿泊施設', desc: '希望の宿泊施設を予約しましょう', urgent: true },
              { icon: '🚗', title: '交通手段', desc: '移動手段を確保しましょう', urgent: true },
              { icon: '🎫', title: 'チケット・体験', desc: '事前予約が必要な施設をチェック', urgent: false },
              { icon: '📱', title: 'アプリ・マップ', desc: '旅行先の地図アプリをダウンロード', urgent: false }
            ].map((item, index) => (
              <div key={index} className={`flex items-center space-x-4 p-4 rounded-lg ${
                item.urgent ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
              }`}>
                <div className="text-2xl">{item.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 flex items-center">
                    {item.title}
                    {item.urgent && <span className="ml-2 text-red-600 text-sm">• 要予約</span>}
                  </div>
                  <div className={`text-sm ${item.urgent ? 'text-red-700' : 'text-gray-600'}`}>
                    {item.desc}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleNewPlan}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            新しいプランを作成
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}