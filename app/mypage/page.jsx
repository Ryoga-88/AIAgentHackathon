'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import UserProfile from '../../components/Auth/UserProfile';

export default function MyPage() {
  const { currentUser, logout, updateUserProfile, getUserPreferences, updateUserPreferences } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [travelHistory, setTravelHistory] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    defaultBudget: 50000,
    preferredDuration: 3,
    interests: [],
    notifications: {
      email: true,
      push: false,
      marketing: false
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // 認証チェック
  useEffect(() => {
    if (!currentUser) {
      router.push('/login?redirect=%2Fmypage');
    }
  }, [currentUser, router]);

  // 旅行履歴を取得
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          // Firestoreからユーザー設定を取得
          const preferences = await getUserPreferences();
          if (Object.keys(preferences).length > 0) {
            setUserPreferences(preferences);
          }
          
          // LocalStorageから現在の旅行プランを取得（一時的）
          const storedPlans = localStorage.getItem('travelPlans');
          const userTravelHistory = JSON.parse(localStorage.getItem(`travelHistory_${currentUser.uid}`)) || [];
          
          if (storedPlans) {
            const plans = JSON.parse(storedPlans);
            const history = Array.isArray(plans.plans) ? plans.plans : (Array.isArray(plans) ? plans : []);
            setTravelHistory([...userTravelHistory, ...history]);
          } else {
            setTravelHistory(userTravelHistory);
          }
        } catch (error) {
          console.error('ユーザーデータ取得エラー:', error);
          // エラーの場合はLocalStorageから取得
          const storedPreferences = JSON.parse(localStorage.getItem(`userPreferences_${currentUser.uid}`)) || userPreferences;
          setUserPreferences(storedPreferences);
        }
      }
    };

    loadUserData();
  }, [currentUser, getUserPreferences]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditData({
      displayName: currentUser.displayName || '',
      email: currentUser.email || ''
    });
  };

  const handleSaveProfile = async () => {
    try {
      // Firebaseプロフィール更新
      await updateUserProfile(editData);
      setIsEditing(false);
      alert('プロフィールを更新しました');
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      alert('プロフィール更新に失敗しました');
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...userPreferences, [key]: value };
    setUserPreferences(newPreferences);
    
    try {
      // Firestoreに保存
      await updateUserPreferences(newPreferences);
    } catch (error) {
      console.error('設定保存エラー:', error);
      // エラーの場合はLocalStorageに保存
      localStorage.setItem(`userPreferences_${currentUser.uid}`, JSON.stringify(newPreferences));
    }
  };

  const handleInterestToggle = (interest) => {
    const currentInterests = userPreferences.interests || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    
    handlePreferenceChange('interests', newInterests);
  };

  const interests = [
    { id: 'heritage', label: '歴史・文化', icon: '🏛️' },
    { id: 'nature', label: '自然・景色', icon: '🌸' },
    { id: 'food', label: 'グルメ', icon: '🍜' },
    { id: 'entertainment', label: 'エンターテイメント', icon: '🎭' },
    { id: 'experience', label: '体験・アクティビティ', icon: '🎨' },
    { id: 'shopping', label: 'ショッピング', icon: '🛍️' },
    { id: 'relaxation', label: 'リラクゼーション', icon: '♨️' }
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                ホームに戻る
              </button>
              <h1 className="text-2xl font-bold text-gray-900">マイページ</h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-4 mb-6">
                {currentUser.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt="プロフィール"
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentUser.displayName || 'ゲスト'}
                  </h2>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>👤</span>
                    <span>プロフィール</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'history' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>📅</span>
                    <span>旅行履歴</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'preferences' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>⚙️</span>
                    <span>設定・好み</span>
                  </div>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span>🚪</span>
                    <span>ログアウト</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">プロフィール情報</h3>
                  {!isEditing && (
                    <button
                      onClick={handleEditProfile}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      編集
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        表示名
                      </label>
                      <input
                        type="text"
                        value={editData.displayName}
                        onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス
                      </label>
                      <input
                        type="email"
                        value={editData.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">メールアドレスの変更はサポートにお問い合わせください</p>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleSaveProfile}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">表示名</label>
                        <p className="text-lg text-gray-900">{currentUser.displayName || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                        <p className="text-lg text-gray-900">{currentUser.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">アカウント作成日</label>
                        <p className="text-lg text-gray-900">
                          {currentUser.metadata?.creationTime 
                            ? new Date(currentUser.metadata.creationTime).toLocaleDateString('ja-JP')
                            : '不明'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">最終ログイン</label>
                        <p className="text-lg text-gray-900">
                          {currentUser.metadata?.lastSignInTime
                            ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString('ja-JP')
                            : '不明'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Travel History Tab */}
            {activeTab === 'history' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">旅行履歴</h3>
                
                {travelHistory.length > 0 ? (
                  <div className="space-y-6">
                    {travelHistory.map((trip, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {trip.hero?.title || `旅行プラン ${index + 1}`}
                            </h4>
                            <p className="text-gray-600 mb-3">
                              {trip.hero?.subtitle || trip.hero?.destination || '詳細なし'}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              {trip.hero?.duration && (
                                <span className="flex items-center">
                                  <span className="mr-1">📅</span>
                                  {trip.hero.duration}
                                </span>
                              )}
                              {trip.hero?.budget && (
                                <span className="flex items-center">
                                  <span className="mr-1">💰</span>
                                  {trip.hero.budget}
                                </span>
                              )}
                              {trip.hero?.destination && (
                                <span className="flex items-center">
                                  <span className="mr-1">📍</span>
                                  {trip.hero.destination}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            {trip.hero?.hero_image && (
                              <img
                                src={trip.hero.hero_image}
                                alt={trip.hero.title}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            {trip.hero?.highlights?.slice(0, 3).map((highlight, idx) => (
                              <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                {highlight}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => router.push(`/plan/${trip.trip_id || index}`)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            詳細を見る →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">まだ旅行プランがありません</h4>
                    <p className="text-gray-600 mb-6">新しい旅行プランを作成して、素敵な旅を始めましょう！</p>
                    <button
                      onClick={() => router.push('/')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      旅行プランを作成する
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">設定・好み</h3>
                
                <div className="space-y-8">
                  {/* Default Travel Preferences */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">旅行の基本設定</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          デフォルト予算
                        </label>
                        <select
                          value={userPreferences.defaultBudget}
                          onChange={(e) => handlePreferenceChange('defaultBudget', parseInt(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={20000}>¥10,000 - ¥20,000</option>
                          <option value={30000}>¥20,000 - ¥30,000</option>
                          <option value={50000}>¥30,000 - ¥50,000</option>
                          <option value={80000}>¥50,000 - ¥80,000</option>
                          <option value={100000}>¥80,000〜</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          デフォルト旅行期間
                        </label>
                        <select
                          value={userPreferences.preferredDuration}
                          onChange={(e) => handlePreferenceChange('preferredDuration', parseInt(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={1}>日帰り</option>
                          <option value={2}>1泊2日</option>
                          <option value={3}>2泊3日</option>
                          <option value={4}>3泊4日</option>
                          <option value={7}>1週間</option>
                          <option value={14}>2週間</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Interest Preferences */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">興味・関心</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {interests.map(interest => (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => handleInterestToggle(interest.id)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            userPreferences.interests?.includes(interest.id)
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

                  {/* Notification Settings */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">通知設定</h4>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userPreferences.notifications?.email || false}
                          onChange={(e) => handlePreferenceChange('notifications', {
                            ...userPreferences.notifications,
                            email: e.target.checked
                          })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">メール通知を受け取る</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userPreferences.notifications?.push || false}
                          onChange={(e) => handlePreferenceChange('notifications', {
                            ...userPreferences.notifications,
                            push: e.target.checked
                          })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">プッシュ通知を受け取る</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userPreferences.notifications?.marketing || false}
                          onChange={(e) => handlePreferenceChange('notifications', {
                            ...userPreferences.notifications,
                            marketing: e.target.checked
                          })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">マーケティング情報を受け取る</span>
                      </label>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">アカウント操作</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          localStorage.clear();
                          alert('データを削除しました');
                        }}
                        className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg hover:bg-yellow-200 transition-colors"
                      >
                        ローカルデータを削除
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) {
                            // アカウント削除のロジック
                            console.log('アカウント削除');
                          }
                        }}
                        className="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        アカウントを削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
