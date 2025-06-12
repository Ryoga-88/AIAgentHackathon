"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    destination: "",
    duration: 2,
    people: 2,
    budget: 50000,
    interests: []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // デモ用: 1秒後にプラン一覧ページに遷移
    setTimeout(() => {
      router.push('/plans');
    }, 1000);
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const interests = [
    { id: 'heritage', label: '歴史・文化', icon: '🏛️' },
    { id: 'nature', label: '自然・景色', icon: '🌸' },
    { id: 'food', label: 'グルメ', icon: '🍜' },
    { id: 'experience', label: '体験・アクティビティ', icon: '🎨' },
    { id: 'shopping', label: 'ショッピング', icon: '🛍️' },
    { id: 'relaxation', label: 'リラクゼーション', icon: '♨️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-90"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&h=900&fit=crop')"
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            旅行 AI プランナー
          </h1>
          <p className="mt-6 text-xl text-blue-100 max-w-3xl">
            あなたの理想の旅を、AIが完璧にプランニング。
            目的地から体験まで、パーソナライズされた旅程を提案します。
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              旅行の希望を教えてください
            </h2>
            <p className="text-lg text-gray-600">
              数分で、あなただけの特別な旅程を作成します
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                行き先
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="例: 京都、白川郷、沖縄"
                value={formData.destination}
                onChange={(e) => setFormData({...formData, destination: e.target.value})}
              />
            </div>

            {/* Duration & People */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日数
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                >
                  <option value={1}>1日</option>
                  <option value={2}>2日</option>
                  <option value={3}>3日</option>
                  <option value={4}>4日</option>
                  <option value={5}>5日</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  人数
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.people}
                  onChange={(e) => setFormData({...formData, people: parseInt(e.target.value)})}
                >
                  <option value={1}>1人</option>
                  <option value={2}>2人</option>
                  <option value={3}>3人</option>
                  <option value={4}>4人</option>
                  <option value={5}>5人以上</option>
                </select>
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予算（1人あたり）
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: parseInt(e.target.value)})}
              >
                <option value={20000}>〜¥20,000</option>
                <option value={30000}>¥20,000 - ¥30,000</option>
                <option value={50000}>¥30,000 - ¥50,000</option>
                <option value={80000}>¥50,000 - ¥80,000</option>
                <option value={100000}>¥80,000〜</option>
              </select>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                興味のあること（複数選択可）
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interests.map(interest => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => handleInterestToggle(interest.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      formData.interests.includes(interest.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-1">{interest.icon}</div>
                    <div className="text-sm font-medium">{interest.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-6">
              <button
                type="submit"
                disabled={loading || !formData.destination}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    AIがプランを作成中...
                  </div>
                ) : (
                  '旅程プランを作成する'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
