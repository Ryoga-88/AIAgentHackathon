"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getMockSchedule } from "../../data/mockData";

export default function ConfirmPage() {
  const router = useRouter();
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const plan = getMockSchedule();

  const handleExport = async () => {
    setIsExporting(true);
    
    // デモ用: 2秒後にダウンロード完了
    setTimeout(() => {
      setIsExporting(false);
      alert(`${exportFormat.toUpperCase()}形式でダウンロードが完了しました！`);
    }, 2000);
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
              <div className="text-gray-600">{plan.hero.duration}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold text-gray-900">予算</div>
              <div className="text-gray-600">{plan.hero.budget}</div>
            </div>
          </div>

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

        {/* Export Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">旅程をエクスポート</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setExportFormat('pdf')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                exportFormat === 'pdf'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="text-3xl mb-2">📄</div>
              <div className="font-semibold">PDF形式</div>
              <div className="text-sm opacity-75">印刷に最適な詳細版</div>
            </button>
            
            <button
              onClick={() => setExportFormat('slides')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                exportFormat === 'slides'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="font-semibold">スライド形式</div>
              <div className="text-sm opacity-75">プレゼンテーション用</div>
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isExporting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                エクスポート中...
              </div>
            ) : (
              `${exportFormat.toUpperCase()}形式でダウンロード`
            )}
          </button>
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