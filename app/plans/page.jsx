"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getMockPlans } from "../../data/mockData";

export default function PlansPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(0);
  const plans = getMockPlans();

  const handlePlanSelect = (planIndex) => {
    router.push(`/plan/${plans[planIndex].trip_id}`);
  };

  const handleRegenerate = () => {
    // デモ用: 簡単な確認後にランディングページに戻る
    if (confirm('新しいプランを生成しますか？')) {
      router.push('/');
    }
  };

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

      {/* Plan Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
          {plans.map((plan, index) => (
            <button
              key={plan.trip_id}
              onClick={() => setSelectedTab(index)}
              className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all duration-200 ${
                selectedTab === index
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="text-lg font-semibold">{plan.hero.title}</div>
              <div className="text-sm opacity-75">{plan.hero.duration} • {plan.hero.budget}</div>
            </button>
          ))}
        </div>

        {/* Selected Plan Content */}
        <div className="space-y-8">
          {plans.map((plan, index) => {
            if (index !== selectedTab) return null;
            
            return (
              <div key={plan.trip_id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Hero Image */}
                <div className="relative h-80 lg:h-96">
                  <img
                    src={plan.hero.hero_image}
                    alt={plan.hero.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h2 className="text-4xl font-bold text-white mb-2">{plan.hero.title}</h2>
                    <p className="text-xl text-gray-200 mb-4">{plan.hero.subtitle}</p>
                    <div className="flex flex-wrap gap-4 text-white">
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        📍 {plan.hero.destination}
                      </span>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        📅 {plan.hero.duration}
                      </span>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        💰 {plan.hero.budget}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">旅のハイライト</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {plan.hero.highlights.map((highlight, idx) => (
                      <div key={idx} className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-blue-700 font-medium">{highlight}</div>
                      </div>
                    ))}
                  </div>

                  {/* Itinerary Preview */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">旅程プレビュー</h3>
                  <div className="space-y-6">
                    {plan.itinerary.map((day) => (
                      <div key={day.day} className="border-l-4 border-blue-200 pl-6">
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">
                            Day {day.day} - {day.city.name}
                          </h4>
                          <p className="text-gray-600">{day.city.description}</p>
                        </div>
                        <div className="space-y-3">
                          {day.activities.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg">
                              <img
                                src={activity.image}
                                alt={activity.title}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm text-blue-600 font-medium">{activity.time}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                                <h5 className="font-semibold text-gray-900">{activity.title}</h5>
                                <p className="text-gray-600 text-sm">{activity.subtitle}</p>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                  <span>💰 {activity.price}</span>
                                  <span>⭐ {activity.rating}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4 mt-8 pt-8 border-t">
                    <button
                      onClick={() => handlePlanSelect(index)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      このプランを選択
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors"
                    >
                      部分調整
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}