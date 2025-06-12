'use client';

import { useState } from 'react';

export default function TestAPIPage() {
  const [formData, setFormData] = useState({
    destination: '',
    duration: '',
    budget: '',
    number_of_people: '',
    interests: '',
    additional_requests: '',
    participants: []
  });

  // プリセットテンプレート
  const presets = {
    tokyo: {
      name: '東京2日間',
      data: {
        destination: '東京',
        duration: '2日間',
        budget: '50000円',
        number_of_people: '2人',
        interests: '観光、グルメ',
        additional_requests: '',
        participants: [
          { name: '田中さん', wishes: ['東京タワー', '浅草寺'] },
          { name: '山田さん', wishes: ['上野動物園', '秋葉原'] }
        ]
      }
    },
    kyoto: {
      name: '京都3日間',
      data: {
        destination: '京都',
        duration: '3日間',
        budget: '80000円',
        number_of_people: '3人',
        interests: '歴史、文化、抹茶',
        additional_requests: '',
        participants: [
          { name: '佐藤さん', wishes: ['清水寺', '金閣寺'] },
          { name: '鈴木さん', wishes: ['伏見稲荷大社', '嵐山'] },
          { name: '高橋さん', wishes: ['祇園', '錦市場'] }
        ]
      }
    },
    osaka: {
      name: '大阪1日間',
      data: {
        destination: '大阪',
        duration: '1日間',
        budget: '15000円',
        number_of_people: '2人',
        interests: 'グルメ、ショッピング',
        additional_requests: '',
        participants: [
          { name: '田村さん', wishes: ['大阪城', 'USJ'] },
          { name: '中村さん', wishes: ['道頓堀', '新世界'] }
        ]
      }
    },
    custom: {
      name: 'カスタム',
      data: {
        destination: '',
        duration: '',
        budget: '',
        number_of_people: '',
        interests: '',
        additional_requests: '',
        participants: []
      }
    }
  };

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('form');
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [selectedPlan, setSelectedPlan] = useState(0); // 選択中のプラン番号（0,1,2）

  // プリセット選択ハンドラー
  const handlePresetChange = (presetKey) => {
    setSelectedPreset(presetKey);
    setFormData(presets[presetKey].data);
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      destination: '',
      duration: '',
      budget: '',
      number_of_people: '',
      interests: '',
      additional_requests: '',
      participants: []
    });
    setSelectedPreset('custom');
    setResult(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setSelectedPreset('custom'); // 手動変更時はカスタムに切り替え
  };

  // 参加者の追加
  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [
        ...prev.participants,
        {
          name: '',
          wishes: []
        }
      ]
    }));
    setSelectedPreset('custom');
  };

  // 参加者の削除
  const removeParticipant = (index) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
    setSelectedPreset('custom');
  };

  // 参加者情報の更新
  const updateParticipant = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map((participant, i) => 
        i === index ? { ...participant, [field]: value } : participant
      )
    }));
    setSelectedPreset('custom');
  };

  // 配列フィールドの更新（wishes, interests, restrictions）
  const updateParticipantArray = (index, field, value) => {
    const arrayValue = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    updateParticipant(index, field, arrayValue);
  };

  const handleTravelPlanTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/travel-plan-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setActiveTab('result');
    } catch (err) {
      setError(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          AI Travel Planner API テストページ
        </h1>

        {/* タブナビゲーション */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('form')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'form'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              旅行プラン生成
            </button>
            <button
              onClick={() => setActiveTab('result')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'result'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              結果表示
            </button>
          </nav>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 旅行プラン生成フォーム */}
        {activeTab === 'form' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">旅行プラン生成テスト</h2>
              <div className="flex space-x-2">
                <button
                  onClick={resetForm}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  フォームリセット
                </button>
              </div>
            </div>

            {/* プリセット選択 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">プリセットテンプレート</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(presets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className={`p-3 text-sm rounded-md border ${
                      selectedPreset === key
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目的地 *
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  期間
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予算
                </label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  人数
                </label>
                <input
                  type="text"
                  name="number_of_people"
                  value={formData.number_of_people}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  興味・関心
                </label>
                <input
                  type="text"
                  name="interests"
                  value={formData.interests}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  その他の要望
                </label>
                <textarea
                  name="additional_requests"
                  value={formData.additional_requests}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 参加者情報セクション */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">参加者の要望</h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={addParticipant}
                    className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                  >
                    + 参加者を追加
                  </button>
                  {formData.participants.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, participants: [] }))}
                      className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700"
                    >
                      全て削除
                    </button>
                  )}
                </div>
              </div>
              
              {formData.participants.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  参加者が登録されていません。「+ 参加者を追加」ボタンで追加してください。
                </div>
              )}
              
              <div className="space-y-6">
                {formData.participants.map((participant, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">参加者 {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeParticipant(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        削除
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          名前
                        </label>
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 田中さん"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          行きたい場所（カンマ区切り）
                        </label>
                        <input
                          type="text"
                          value={participant.wishes.join(', ')}
                          onChange={(e) => updateParticipantArray(index, 'wishes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 東京タワー, 浅草寺"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex space-x-4">
              <button
                onClick={handleTravelPlanTest}
                disabled={loading || !formData.destination}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '生成中...' : '旅行プランを生成'}
              </button>
              {result && (
                <button
                  onClick={() => setActiveTab('result')}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  結果を表示
                </button>
              )}
            </div>
            
            {!formData.destination && (
              <p className="mt-2 text-sm text-red-600">※ 目的地は必須項目です</p>
            )}
          </div>
        )}


        {/* 結果表示 */}
        {activeTab === 'result' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">API レスポンス結果</h2>
            
            {result ? (
              <div className="space-y-6">
                {/* プラン選択 */}
                {result.plans && result.plans.length > 0 ? (
                  <>
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-medium mb-3">プラン選択</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.plans.map((plan, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedPlan(index)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              selectedPlan === index
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            プラン{plan.plan_number} 
                            {plan.weather_type === 'sunny' ? '☀️ 晴れ' : '🌧️ 雨'}
                            <div className="text-xs opacity-75">{plan.theme}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 選択されたプランの基本情報 */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        プラン{result.plans[selectedPlan].plan_number} - 基本情報
                        <span className="ml-2 text-sm text-gray-500">
                          ({result.plans[selectedPlan].weather_type === 'sunny' ? '晴れの日用' : '雨の日用'})
                        </span>
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Trip ID:</strong> {result.plans[selectedPlan].trip_id}</div>
                        <div><strong>テーマ:</strong> {result.plans[selectedPlan].theme}</div>
                        <div><strong>目的地:</strong> {result.plans[selectedPlan].hero?.destination}</div>
                        <div><strong>期間:</strong> {result.plans[selectedPlan].hero?.duration}</div>
                      </div>
                      {result.plans[selectedPlan].theme_description && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-md">
                          <strong>テーマ説明:</strong> {result.plans[selectedPlan].theme_description}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // 旧形式（単一プラン）の場合
                  <div>
                    <h3 className="text-lg font-medium mb-2">基本情報</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Trip ID:</strong> {result.trip_id}</div>
                      <div><strong>テーマ:</strong> {result.theme}</div>
                      <div><strong>目的地:</strong> {result.hero?.destination}</div>
                      <div><strong>期間:</strong> {result.hero?.duration}</div>
                    </div>
                  </div>
                )}


                {/* 日程詳細 */}
                <div>
                  <h3 className="text-lg font-medium mb-2">日程詳細</h3>
                  <div className="space-y-4">
                    {/* 新形式（3プラン）の場合 */}
                    {result.plans && result.plans.length > 0 ? (
                      result.plans[selectedPlan].itinerary?.map((day, dayIndex) => (
                        <div key={dayIndex} className="border border-gray-200 rounded-md p-4">
                          <h4 className="font-medium mb-2">
                            {day.day}日目 - {day.city?.name} ({day.date})
                          </h4>
                          
                          {/* 活動一覧 */}
                          <div className="space-y-2">
                            {day.activities?.map((activity, actIndex) => (
                              <div key={actIndex} className="pl-4 border-l-2 border-gray-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <strong>{activity.time}:</strong> {activity.title}
                                    {activity.type && (
                                      <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                        {activity.type}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                  📍 {activity.location}
                                  {activity.price && <span className="ml-2">💰 {activity.price}</span>}
                                </div>
                                {activity.description && (
                                  <div className="mt-1 text-sm text-gray-500">
                                    {activity.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      // 旧形式（単一プラン）の場合
                      result.itinerary?.map((day, dayIndex) => (
                        <div key={dayIndex} className="border border-gray-200 rounded-md p-4">
                          <h4 className="font-medium mb-2">
                            {day.day}日目 - {day.city?.name} ({day.date})
                          </h4>
                          
                          {/* 活動一覧 */}
                          <div className="space-y-2">
                            {day.activities?.map((activity, actIndex) => (
                              <div key={actIndex} className="pl-4 border-l-2 border-gray-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <strong>{activity.time}:</strong> {activity.title}
                                  </div>
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                  📍 {activity.location}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* JSON生データ */}
                <div>
                  <h3 className="text-lg font-medium mb-2">JSON レスポンス（生データ）</h3>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">まず旅行プランを生成してください。</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}