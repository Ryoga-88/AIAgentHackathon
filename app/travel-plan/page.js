'use client';

import { useState } from 'react';

export default function TravelPlanTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.target);
    const data = {
      destination: formData.get('destination'),
      duration: formData.get('duration'),
      budget: formData.get('budget'),
      number_of_people: formData.get('number_of_people'),
      interests: formData.get('interests'),
      additional_requests: formData.get('additional_requests')
    };

    try {
      const response = await fetch('/api/travel-plan-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'APIリクエストに失敗しました');
      }

      const resultData = await response.json();
      setResult(resultData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">旅行プランテスト</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="destination" className="block mb-1">
                目的地 (必須)
              </label>
              <input
                id="destination"
                name="destination"
                type="text"
                required
                className="w-full p-2 border rounded"
                placeholder="例: 京都"
              />
            </div>
            
            <div>
              <label htmlFor="duration" className="block mb-1">
                期間
              </label>
              <input
                id="duration"
                name="duration"
                type="text"
                className="w-full p-2 border rounded"
                placeholder="例: 3日間"
              />
            </div>
            
            <div>
              <label htmlFor="budget" className="block mb-1">
                予算
              </label>
              <input
                id="budget"
                name="budget"
                type="text"
                className="w-full p-2 border rounded"
                placeholder="例: 10万円"
              />
            </div>
            
            <div>
              <label htmlFor="number_of_people" className="block mb-1">
                人数
              </label>
              <input
                id="number_of_people"
                name="number_of_people"
                type="text"
                className="w-full p-2 border rounded"
                placeholder="例: 2人"
              />
            </div>
            
            <div>
              <label htmlFor="interests" className="block mb-1">
                興味
              </label>
              <input
                id="interests"
                name="interests"
                type="text"
                className="w-full p-2 border rounded"
                placeholder="例: 歴史、食べ物、自然"
              />
            </div>
            
            <div>
              <label htmlFor="additional_requests" className="block mb-1">
                その他の要望
              </label>
              <textarea
                id="additional_requests"
                name="additional_requests"
                className="w-full p-2 border rounded"
                rows="3"
                placeholder="例: 子供連れなので、子供が楽しめるスポットも含めてほしい"
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-foreground text-background rounded-full hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
            >
              {loading ? '生成中...' : 'プラン生成'}
            </button>
          </form>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">結果</h2>
          
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
              エラー: {error}
            </div>
          )}
          
          {loading && <div className="text-gray-500">生成中...</div>}
          
          {result && (
            <div className="bg-black/[.05] dark:bg-white/[.06] p-4 rounded overflow-auto max-h-[600px]">
              <pre className="font-mono text-sm whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}