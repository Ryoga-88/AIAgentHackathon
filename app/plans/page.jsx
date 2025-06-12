"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getMockPlans } from "../../data/mockData";

export default function PlansPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [regeneratingActivity, setRegeneratingActivity] = useState(null);
  const [regenerateComment, setRegenerateComment] = useState('');
  const plans = getMockPlans();

  const handlePlanSelect = (planIndex) => {
    setSelectedPlan(planIndex);
    setExpandedDay(null);
    setRegeneratingActivity(null);
  };

  const handleConfirmPlan = () => {
    router.push('/confirm');
  };

  const handleRegenerate = () => {
    if (confirm('新しいプランを生成しますか？')) {
      router.push('/');
    }
  };

  const handleRegenerateActivity = (dayIndex, activityIndex) => {
    setRegeneratingActivity(`${dayIndex}-${activityIndex}`);
    setRegenerateComment('');
  };

  const handleSubmitRegenerate = () => {
    // 実際の再生成処理をここに実装
    console.log('観光名所を再生成:', regenerateComment);
    setRegeneratingActivity(null);
    setRegenerateComment('');
  };

  const handleBookingClick = (type) => {
    console.log(`${type}の予約を開始`);
  };

  const selectedPlanData = selectedPlan !== null ? plans[selectedPlan] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">旅行プラン提案</h1>
              <p className="text-gray-600">あなたに最適な3つのプランをご用意しました</p>
            </div>
            <button
              onClick={handleRegenerate}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              新しいプランを生成
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Plan Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, index) => (
            <div
              key={plan.trip_id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                selectedPlan === index ? 'ring-4 ring-blue-500 ring-opacity-50' : 'hover:shadow-xl'
              }`}
              onClick={() => handlePlanSelect(index)}
            >
              <div className="relative h-48">
                <img
                  src={plan.hero.hero_image}
                  alt={plan.hero.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.hero.title}</h3>
                  <p className="text-gray-200 text-sm">{plan.hero.subtitle}</p>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-blue-600 font-semibold">{plan.hero.duration}</span>
                  <span className="text-purple-600 font-semibold">{plan.hero.budget}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {plan.hero.highlights.slice(0, 2).map((highlight, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                      {highlight}
                    </span>
                  ))}
                  {plan.hero.highlights.length > 2 && (
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                      +{plan.hero.highlights.length - 2}
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">📍 {plan.hero.destination}</span>
                  {selectedPlan === index && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                      選択中
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Plan Details */}
        {selectedPlanData && (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Detailed Itinerary */}
              <div className="space-y-8">
                {selectedPlanData.itinerary.map((day, dayIndex) => (
                  <div key={day.day} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Day Header */}
                    <div className="relative h-32 sm:h-40">
                      <img
                        src={day.city.image}
                        alt={day.city.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white">Day {day.day}</h3>
                        <p className="text-lg text-gray-200">{day.city.name} - {day.city.description}</p>
                      </div>
                    </div>

                    {/* Activities */}
                    <div className="p-6">
                      <div className="space-y-6">
                        {day.activities.map((activity, activityIndex) => (
                          <div key={activity.id} className="border border-gray-100 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row gap-6">
                              <div className="sm:w-48 flex-shrink-0">
                                <img
                                  src={activity.image}
                                  alt={activity.title}
                                  className="w-full h-32 sm:h-36 object-cover rounded-lg"
                                />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <span className="text-blue-600 font-semibold text-lg">{activity.time}</span>
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        activity.priority === 'must_see' 
                                          ? 'bg-red-100 text-red-700'
                                          : activity.priority === 'must_do'
                                          ? 'bg-orange-100 text-orange-700'
                                          : 'bg-green-100 text-green-700'
                                      }`}>
                                        {activity.priority === 'must_see' ? '必見' : 
                                         activity.priority === 'must_do' ? '必須' : 'おすすめ'}
                                      </span>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-1">{activity.title}</h4>
                                    <p className="text-gray-600 font-medium mb-2">{activity.subtitle}</p>
                                  </div>
                                  <div className="ml-4">
                                    <button
                                      onClick={() => handleRegenerateActivity(dayIndex, activityIndex)}
                                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                                    >
                                      再生成
                                    </button>
                                  </div>
                                </div>
                                
                                <p className="text-gray-700 mb-4 leading-relaxed">{activity.description}</p>
                                
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                  <div className="flex items-center">
                                    <span className="text-gray-500 mr-1">📍</span>
                                    <span className="text-gray-700">{activity.location}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 mr-1">💰</span>
                                    <span className="text-gray-700 font-medium">{activity.price}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-yellow-500 mr-1">⭐</span>
                                    <span className="text-gray-700 font-medium">{activity.rating}</span>
                                  </div>
                                </div>
                                
                                {activity.tips && (
                                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                                    <p className="text-yellow-800">
                                      <span className="font-medium">💡 Tip: </span>
                                      {activity.tips}
                                    </p>
                                  </div>
                                )}

                                {/* Regenerate Form */}
                                {regeneratingActivity === `${dayIndex}-${activityIndex}` && (
                                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                                    <h5 className="font-medium text-gray-900 mb-3">観光名所を再生成</h5>
                                    <div className="space-y-3">
                                      <div className="text-sm text-gray-700 mb-2">
                                        現在の観光名所: <strong>{activity.title}</strong>
                                      </div>
                                      <textarea
                                        value={regenerateComment}
                                        onChange={(e) => setRegenerateComment(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        rows="3"
                                        placeholder="どのような観光名所をお望みですか？（例：もっと歴史的な場所、子供向けの施設、静かな場所など）"
                                      />
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={handleSubmitRegenerate}
                                          disabled={!regenerateComment.trim()}
                                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        >
                                          再生成実行
                                        </button>
                                        <button
                                          onClick={() => setRegeneratingActivity(null)}
                                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                                        >
                                          キャンセル
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <div className="sticky top-8 space-y-6">
                {/* Booking Links */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 予約リンク</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleBookingClick('hotel')}
                      className="w-full bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors text-left group"
                    >
                      <div className="flex items-center">
                        <div className="text-2xl mr-3 group-hover:scale-110 transition-transform">🏨</div>
                        <div>
                          <div className="font-medium text-gray-900">宿泊施設を予約</div>
                          <div className="text-sm text-gray-600">おすすめホテル・旅館</div>
                        </div>
                        <svg className="w-5 h-5 ml-auto text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleBookingClick('transport')}
                      className="w-full bg-green-50 hover:bg-green-100 p-4 rounded-lg transition-colors text-left group"
                    >
                      <div className="flex items-center">
                        <div className="text-2xl mr-3 group-hover:scale-110 transition-transform">🚗</div>
                        <div>
                          <div className="font-medium text-gray-900">交通手段を予約</div>
                          <div className="text-sm text-gray-600">電車・バス・レンタカー</div>
                        </div>
                        <svg className="w-5 h-5 ml-auto text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleBookingClick('tickets')}
                      className="w-full bg-purple-50 hover:bg-purple-100 p-4 rounded-lg transition-colors text-left group"
                    >
                      <div className="flex items-center">
                        <div className="text-2xl mr-3 group-hover:scale-110 transition-transform">🎫</div>
                        <div>
                          <div className="font-medium text-gray-900">チケット・体験予約</div>
                          <div className="text-sm text-gray-600">入場券・アクティビティ</div>
                        </div>
                        <svg className="w-5 h-5 ml-auto text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Plan Summary */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 プラン概要</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">期間</span>
                      <span className="font-medium">{selectedPlanData.hero.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">予算目安</span>
                      <span className="font-medium">{selectedPlanData.hero.budget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">テーマ</span>
                      <span className="font-medium capitalize">{selectedPlanData.theme.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleConfirmPlan}
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                  >
                    <span>プランを確定する</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>

                {/* Additional Info */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-2">💡 お得な情報</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    早期予約で最大20%オフ！宿泊施設とセットで予約するとさらにお得です。
                  </p>
                  <div className="text-xs text-blue-600 font-medium">
                    キャンペーン期間: 6月末まで
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedPlan === null && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">プランを選択してください</h3>
            <p className="text-gray-600">上記のカードから気に入ったプランをクリックして詳細をご覧ください</p>
          </div>
        )}
      </div>
    </div>
  );
}