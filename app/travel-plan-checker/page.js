'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TravelPlanChecker() {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [budget, setBudget] = useState('');
  const [interests, setInterests] = useState('');
  const [additionalRequests, setAdditionalRequests] = useState('');
  const [travelPlan, setTravelPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 旅行プランを生成する
  const generateTravelPlan = async () => {
    if (!destination) {
      setError('目的地を入力してください');
      return;
    }

    if (!duration) {
      setError('期間を入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/travel-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination,
          duration,
          budget,
          interests,
          additional_requests: additionalRequests,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '旅行プランの生成に失敗しました');
      }
      
      const data = await response.json();
      setTravelPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 日付をフォーマットする
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ja-JP', options);
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <span className="text-sm">← ホームに戻る</span>
        </Link>
        <h1 className="text-3xl font-bold mb-2">旅行プランジェネレーター</h1>
        <p className="text-gray-600 dark:text-gray-400">
          旅行の条件を入力して、AIが旅行プランを生成します。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">旅行条件を入力</h2>
          
          <div className="mb-4">
            <label htmlFor="destination" className="block text-sm font-medium mb-1">
              目的地 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="例: 京都、北海道、沖縄"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="duration" className="block text-sm font-medium mb-1">
              期間 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="例: 3日間、1週間"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="budget" className="block text-sm font-medium mb-1">
              予算
            </label>
            <input
              type="text"
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="例: 10万円、5万円以内"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="interests" className="block text-sm font-medium mb-1">
              興味・関心
            </label>
            <input
              type="text"
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="例: 歴史、自然、グルメ、アクティビティ"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="additionalRequests" className="block text-sm font-medium mb-1">
              その他の要望
            </label>
            <textarea
              id="additionalRequests"
              value={additionalRequests}
              onChange={(e) => setAdditionalRequests(e.target.value)}
              placeholder="例: 子連れ家族向け、温泉に行きたい、公共交通機関のみで移動したい"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 min-h-[100px]"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={generateTravelPlan}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              旅行プランを生成
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">生成された旅行プラン</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : travelPlan ? (
            <div className="overflow-y-auto max-h-[600px]">
              <div className="mb-4">
                <h3 className="text-2xl font-bold">{travelPlan.title}</h3>
                <p className="text-lg">
                  {travelPlan.destination} - {travelPlan.duration}
                </p>
                {travelPlan.budget && (
                  <p className="text-gray-600 dark:text-gray-400">予算: {travelPlan.budget}</p>
                )}
              </div>
              
              <div className="space-y-6 mt-6">
                {travelPlan.schedule && travelPlan.schedule.map((day, index) => (
                  <div key={index} className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold mb-2">
                      Day {day.day}: {day.date && formatDate(day.date)} - {day.city}
                    </h4>
                    
                    <div className="space-y-4">
                      {day.activities && day.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                          <div className="flex justify-between">
                            <span className="font-medium">{activity.time}</span>
                            <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
                              {activity.category}
                            </span>
                          </div>
                          <p className="mt-1">{activity.activity}</p>
                          {activity.location && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              場所: {activity.location}
                            </p>
                          )}
                          {activity.fee && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              料金: {activity.fee}
                            </p>
                          )}
                          {activity.notes && (
                            <p className="text-sm italic mt-1">{activity.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <p className="mt-3 text-sm font-medium">
                      宿泊: {day.accommodation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-500">
              <p>旅行プランを生成するには、必要な情報を入力して「旅行プランを生成」ボタンをクリックしてください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}