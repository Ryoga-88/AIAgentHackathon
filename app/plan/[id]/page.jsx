"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getMockPlans } from "../../../data/mockData";

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id;
  
  const plans = getMockPlans();
  const plan = plans.find(p => p.trip_id === planId) || plans[0];
  
  const [showBooking, setShowBooking] = useState(false);

  const handleConfirm = () => {
    router.push('/confirm');
  };

  const handleBack = () => {
    router.push('/plans');
  };

  const handleBookingClick = (type) => {
    // 実際の予約サイトにリダイレクトする処理
    console.log(`${type}の予約を開始`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              プラン一覧に戻る
            </button>
            <button
              onClick={handleConfirm}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
            >
              このプランで確定
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hero Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
              <div className="relative h-64 sm:h-80">
                <img
                  src={plan.hero.hero_image}
                  alt={plan.hero.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{plan.hero.title}</h1>
                  <p className="text-xl text-gray-200">{plan.hero.subtitle}</p>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <span className="text-blue-700 font-medium">📍 {plan.hero.destination}</span>
                  </div>
                  <div className="bg-green-50 px-4 py-2 rounded-lg">
                    <span className="text-green-700 font-medium">📅 {plan.hero.duration}</span>
                  </div>
                  <div className="bg-purple-50 px-4 py-2 rounded-lg">
                    <span className="text-purple-700 font-medium">💰 {plan.hero.budget}</span>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-4">旅のハイライト</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {plan.hero.highlights.map((highlight, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-gray-700 font-medium">{highlight}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed Itinerary */}
            <div className="space-y-8">
              {plan.itinerary.map((day) => (
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
                      <h2 className="text-2xl font-bold text-white">Day {day.day}</h2>
                      <p className="text-lg text-gray-200">{day.city.name} - {day.city.description}</p>
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {day.activities.map((activity, idx) => (
                        <div key={activity.id} className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0">
                          <div className="sm:w-48 flex-shrink-0">
                            <img
                              src={activity.image}
                              alt={activity.title}
                              className="w-full h-32 sm:h-36 object-cover rounded-lg"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
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
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{activity.title}</h3>
                                <p className="text-gray-600 font-medium mb-2">{activity.subtitle}</p>
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
            <div className="sticky top-24 space-y-6">
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
                    <div className="text-right">
                      <span className="font-medium">{plan.hero.duration}</span>
                      {plan.itinerary && plan.itinerary.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {plan.itinerary.length}日間のプラン
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">予算目安</span>
                    <span className="font-medium">{plan.hero.budget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">テーマ</span>
                    <span className="font-medium capitalize">{plan.theme.replace('_', ' ')}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleConfirm}
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
      </div>
    </div>
  );
}