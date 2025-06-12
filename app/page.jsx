"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "../contexts/AuthContext";
import UserProfile from "../components/Auth/UserProfile";

// Dynamic import with proper error handling
const ProgressModal = dynamic(() => import("../components/ProgressModalDynamic"), {
  ssr: false,
  loading: () => null
});

export default function Home() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    destination: "",
    people: 2,
    budget: 50000,
    interests: [],
    startDate: "",
    endDate: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  // 期間を計算する関数
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 宿泊日数ではなく旅行日数
    return diffDays;
  };

  // 季節を判定する関数
  const getSeason = (date) => {
    const month = new Date(date).getMonth() + 1; // 0ベースなので+1
    if (month >= 3 && month <= 5) return '春';
    if (month >= 6 && month <= 8) return '夏';
    if (month >= 9 && month <= 11) return '秋';
    return '冬';
  };

  // 季節に応じた考慮事項を取得
  const getSeasonalConsiderations = (season) => {
    const considerations = {
      '春': '桜の開花状況、花粉症対策、気温の変化に対応した服装、春祭りやイベント',
      '夏': '暑さ対策、日焼け対策、水分補給、夏祭り、海水浴、避暑地、冷房設備',
      '秋': '紅葉の見頃、気温の変化、秋の味覚、収穫祭、ハイキングに適した気候',
      '冬': '寒さ対策、雪や氷への対応、温泉、冬のイルミネーション、スキーやスノーボード、防寒具'
    };
    return considerations[season] || '';
  };

  // 日付の妥当性チェック
  const validateDates = () => {
    if (!formData.startDate || !formData.endDate) {
      return "出発日と帰着日を入力してください";
    }
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start < today) {
      return "出発日は今日以降の日付を選択してください";
    }
    
    if (end < start) {
      return "帰着日は出発日以降の日付を選択してください";
    }
    
    const duration = calculateDuration(formData.startDate, formData.endDate);
    if (duration > 7) {
      return "旅行期間は7日以内で設定してください";
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProgress(0);
    
    // 日付バリデーション
    const dateError = validateDates();
    if (dateError) {
      setError(dateError);
      setLoading(false);
      return;
    }
    
    try {
      // 日付をフォーマット
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const duration = calculateDuration(formData.startDate, formData.endDate);
      const season = getSeason(formData.startDate);
      const seasonalConsiderations = getSeasonalConsiderations(season);
      
      // 推定時間は動的に計算するため初期値は設定しない
      setEstimatedTime(0);
      setShowProgress(true);
      
      const formatDate = (date) => {
        return date.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };
      
      // フォームデータを適切な形式に変換
      const requestData = {
        destination: formData.destination,
        duration: duration,
        budget: `${formData.budget.toLocaleString()}円`,
        number_of_people: `${formData.people}人`,
        interests: formData.interests.map(id => interests.find(i => i.id === id)?.label).filter(Boolean).join(', '),
        date: `${formatDate(startDate)}から${formatDate(endDate)}`,
        season: season,
        seasonal_considerations: seasonalConsiderations,
        startDate: formData.startDate,
        endDate: formData.endDate,
        additional_requests: '',
        participants: []
      };

      console.log('🚀 Sending request data:', requestData); // デバッグ用

      // ストリーミングAPIを呼び出し
      const response = await fetch('/api/travel-plan-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let finalPlans = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setProgress(data.progress);
              } else if (data.type === 'complete') {
                finalPlans = data.plans;
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

      if (finalPlans) {
        // 日付情報を含めてLocalStorageに結果を保存
        const plansWithDates = {
          plans: finalPlans,
          travelDates: {
            startDate: formData.startDate,
            endDate: formData.endDate,
            duration: duration
          }
        };
        localStorage.setItem('travelPlans', JSON.stringify(plansWithDates));
        console.log('💾 Saved to localStorage with dates:', plansWithDates); // デバッグ用
        
        // プラン一覧ページに遷移（ログイン不要でプレビュー可能）
        router.push('/plans');
      } else {
        throw new Error('プランの生成が完了しませんでした');
      }
    } catch (err) {
      console.error('❌ Error:', err); // デバッグ用
      setError(`プラン生成エラー: ${err.message}`);
    } finally {
      setLoading(false);
      setShowProgress(false);
      setProgress(0);
    }
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
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${showProgress ? 'overflow-hidden' : ''}`}>
      {/* Header with User Profile */}
      <div className="relative z-10 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-gray-900">旅行 AI プランナー</h2>
            </div>
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className={`relative overflow-hidden bg-white ${showProgress ? 'filter blur-sm' : ''}`}>
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
      <div className={`max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 ${showProgress ? 'filter blur-sm pointer-events-none' : ''}`}>
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              旅行の希望を教えてください
            </h2>
            <p className="text-lg text-gray-600">
              数分で、あなただけの特別な旅程を作成します
            </p>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

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

            {/* Travel Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  出発日
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  帰着日
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* People */}
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
                disabled={loading || showProgress || !formData.destination}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading || showProgress ? (
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

      {/* Progress Modal */}
      <ProgressModal 
        isVisible={showProgress}
        progress={progress}
        totalPlans={3}
        onPlanReceived={() => {}} // プラン受信時のコールバック（必要に応じて実装）
        onCancel={() => {
          setShowProgress(false);
          setLoading(false);
          setProgress(0);
        }}
      />
    </div>
  );
}
