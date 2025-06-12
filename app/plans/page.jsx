"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMockPlans } from "../../data/mockData";
import { getLocationData, extractLocationsFromPlan, getMultipleLocationsData, enrichPlanWithLocationData } from "../../utils/locationUtils";
import InteractiveMap from "../../components/InteractiveMap";

export default function PlansPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [regeneratingActivity, setRegeneratingActivity] = useState(null);
  const [regenerateComment, setRegenerateComment] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState({});
  const [locationData, setLocationData] = useState({});
  const [activityImages, setActivityImages] = useState({});
  const [routeData, setRouteData] = useState({});

  // LLMの出力データまたはローカルストレージからプランを取得
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // まずローカルストレージから最新のプランを確認
        const storedPlans = localStorage.getItem('travelPlans');
        console.log('LocalStorage data:', storedPlans); // デバッグ用
        
        if (storedPlans) {
          const parsedPlans = JSON.parse(storedPlans);
          console.log('Parsed plans:', parsedPlans); // デバッグ用
          
          if (parsedPlans.plans && Array.isArray(parsedPlans.plans)) {
            console.log('Using LLM plans (multiple):', parsedPlans.plans.length); // デバッグ用
            setPlans(parsedPlans.plans);
          } else if (Array.isArray(parsedPlans)) {
            console.log('Using LLM plans (array):', parsedPlans.length); // デバッグ用
            setPlans(parsedPlans);
          } else {
            // 単一プランの場合は配列に変換
            console.log('Using LLM plans (single)'); // デバッグ用
            setPlans([parsedPlans]);
          }
        } else {
          // ローカルストレージにデータがない場合はMockデータを使用
          console.log('Using mock data'); // デバッグ用
          const mockPlans = getMockPlans();
          setPlans(mockPlans);
        }
      } catch (error) {
        console.error('プランの取得に失敗:', error);
        // エラー時はMockデータを使用
        const mockPlans = getMockPlans();
        setPlans(mockPlans);
      }
    };

    fetchPlans();
  }, []);

  // 位置情報とホテル情報を取得
  useEffect(() => {
    if (plans.length === 0) return;

    const fetchData = async () => {
      try {
        const mockPlans = plans;
        
        // 全プランから位置情報を抽出
        const allLocations = new Set();
        mockPlans.forEach(plan => {
          const locations = extractLocationsFromPlan(plan);
          locations.forEach(loc => allLocations.add(loc));
        });

        // 位置情報を一括取得
        const locationsArray = Array.from(allLocations);
        const locationResults = await getMultipleLocationsData(locationsArray);
        setLocationData(locationResults);

        // 各プランの主要都市でホテルを並行検索（パフォーマンス改善）
        const hotelPromises = plans.map(async (plan) => {
          const mainDestination = plan.hero.title;
          if (locationResults[mainDestination] && locationResults[mainDestination].coordinates) {
            try {
              const hotelResponse = await fetch('/api/search-hotels', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  checkin: '2025-12-01',
                  checkout: '2025-12-03',
                  adults: 2,
                  searchType: 'coordinates',
                  coordinates: locationResults[mainDestination].coordinates
                }),
              });

              if (hotelResponse.ok) {
                const hotelData = await hotelResponse.json();
                return { trip_id: plan.trip_id, results: hotelData.results };
              }
            } catch (error) {
              console.error(`ホテル検索エラー (${plan.trip_id}):`, error);
            }
          }
          return { trip_id: plan.trip_id, results: [] };
        });

        const hotelResults = {};
        const hotelResponses = await Promise.all(hotelPromises);
        hotelResponses.forEach(response => {
          hotelResults[response.trip_id] = response.results;
        });
        
        setHotels(hotelResults);

        // アクティビティの画像を並行取得（パフォーマンス改善）
        const activityImagePromises = [];
        const activityImageResults = {};
        
        for (const plan of plans) {
          activityImageResults[plan.trip_id] = {};
          
          for (const day of plan.itinerary || []) {
            for (const activity of day.activities || []) {
              const promise = fetch('/api/places-photos', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  placeName: activity.title
                }),
              })
              .then(async (response) => {
                if (response.ok) {
                  const imageData = await response.json();
                  return { 
                    trip_id: plan.trip_id, 
                    activity_id: activity.id, 
                    data: imageData 
                  };
                }
                return null;
              })
              .catch((error) => {
                console.error(`アクティビティ画像取得エラー (${activity.title}):`, error);
                return null;
              });
              
              activityImagePromises.push(promise);
            }
          }
        }

        const activityImageResponses = await Promise.all(activityImagePromises);
        activityImageResponses.forEach(response => {
          if (response) {
            activityImageResults[response.trip_id][response.activity_id] = response.data;
          }
        });

        setActivityImages(activityImageResults);

        // 各プランの経路情報を並行取得（パフォーマンス改善）
        const routePromises = [];
        const routeResults = {};

        for (const plan of plans) {
          routeResults[plan.trip_id] = {};
          
          // 全体プランルート
          const allWaypoints = [];
          for (const day of plan.itinerary || []) {
            if (day.city && day.city.name) {
              allWaypoints.push(day.city.name);
            }
          }

          if (allWaypoints.length >= 2) {
            const overallPromise = fetch('/api/directions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ waypoints: allWaypoints }),
            })
            .then(async (response) => {
              if (response.ok) {
                const routeData = await response.json();
                return { trip_id: plan.trip_id, type: 'overall', data: routeData };
              }
              return null;
            })
            .catch((error) => {
              console.error(`全体経路取得エラー (${plan.trip_id}):`, error);
              return null;
            });
            
            routePromises.push(overallPromise);
          }

          // 各日のアクティビティ間の経路を取得
          for (const day of plan.itinerary || []) {
            const dailyWaypoints = [];
            
            for (const activity of day.activities || []) {
              if (activity.location) {
                dailyWaypoints.push(activity.location);
              }
            }

            if (dailyWaypoints.length >= 2) {
              const dailyPromise = fetch('/api/directions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ waypoints: dailyWaypoints }),
              })
              .then(async (response) => {
                if (response.ok) {
                  const routeData = await response.json();
                  return { trip_id: plan.trip_id, type: `day_${day.day}`, data: routeData };
                }
                return null;
              })
              .catch((error) => {
                console.error(`Day ${day.day} 経路取得エラー (${plan.trip_id}):`, error);
                return null;
              });
              
              routePromises.push(dailyPromise);
            }
          }
        }

        const routeResponses = await Promise.all(routePromises);
        routeResponses.forEach(response => {
          if (response) {
            routeResults[response.trip_id][response.type] = response.data;
          }
        });

        setRouteData(routeResults);
        setLoading(false);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [plans]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">プランを準備中...</h2>
          <p className="text-gray-600">位置情報とホテル情報を取得しています</p>
        </div>
      </div>
    );
  }

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
        {/* Debug Info - 開発時のみ表示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">🔧 デバッグ情報</h3>
            <div className="text-xs text-yellow-700">
              <p>プラン数: {plans.length}</p>
              <p>データソース: {plans.length > 0 && plans[0].trip_id?.includes('mock') ? 'Mock データ' : 'LLM データ'}</p>
              <p>LocalStorage: {typeof window !== 'undefined' && localStorage.getItem('travelPlans') ? '有り' : '無し'}</p>
              <button 
                onClick={() => {
                  localStorage.removeItem('travelPlans');
                  window.location.reload();
                }}
                className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                LocalStorageクリア & リロード
              </button>
            </div>
          </div>
        )}

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

                      {/* 1日の経路マップ */}
                      {routeData[selectedPlanData.trip_id]?.[`day_${day.day}`] && (
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                            <span className="mr-2">🗺️</span>
                            Day {day.day} の移動ルート
                          </h5>
                          <InteractiveMap
                            staticMapUrl={routeData[selectedPlanData.trip_id][`day_${day.day}`].static_map_url}
                            routeInfo={routeData[selectedPlanData.trip_id][`day_${day.day}`].route}
                            height="250px"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Interactive Route Map */}
                {routeData[selectedPlanData.trip_id]?.overall && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">全体旅行ルート</h3>
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <InteractiveMap
                        staticMapUrl={routeData[selectedPlanData.trip_id].overall.static_map_url}
                        routeInfo={routeData[selectedPlanData.trip_id].overall.route}
                        height="300px"
                      />
                    </div>
                  </div>
                )}

                {/* Recommended Hotels */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">おすすめホテル</h3>
                  {hotels[selectedPlanData.trip_id] && hotels[selectedPlanData.trip_id].length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {hotels[selectedPlanData.trip_id].map((hotel) => (
                        <div key={hotel.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                          <div className="relative">
                            <img
                              src={hotel.image}
                              alt={hotel.name}
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                              ホテル
                            </div>
                          </div>
                          <div className="p-5">
                            <h4 className="font-bold text-gray-900 mb-2 text-lg leading-tight">{hotel.name}</h4>
                            <p className="text-sm text-gray-600 mb-3 flex items-center">
                              <span className="mr-1">📍</span>
                              {hotel.location}
                            </p>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-1">
                                <div className="flex text-yellow-400">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < Math.floor(hotel.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                                      ⭐
                                    </span>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600 ml-1">
                                  {hotel.rating} ({hotel.reviewCount}件)
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xl font-bold text-blue-600">{hotel.price}</span>
                              <a
                                href={hotel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                              >
                                詳細を見る
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <span className="text-yellow-600 mr-2">⚠️</span>
                        <p className="text-yellow-800">
                          この地域のホテル情報を取得中です。しばらくお待ちください。
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Information */}
                {locationData[selectedPlanData.hero.title] && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">エリア情報</h3>
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {locationData[selectedPlanData.hero.title].map_image_url && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <span className="mr-2">🗺️</span>
                              位置情報
                            </h4>
                            <div className="relative group">
                              <img
                                src={locationData[selectedPlanData.hero.title].map_image_url}
                                alt={`${selectedPlanData.hero.title}の地図`}
                                className="w-full h-48 object-cover rounded-lg cursor-pointer group-hover:opacity-90 transition-opacity"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
                                <span className="text-white font-medium">Google Mapsで開く</span>
                              </div>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlanData.hero.title)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0"
                              >
                                <span className="sr-only">Google Mapsで{selectedPlanData.hero.title}を開く</span>
                              </a>
                            </div>
                          </div>
                        )}
                        {locationData[selectedPlanData.hero.title].photo_url && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <span className="mr-2">📸</span>
                              現地の風景
                            </h4>
                            <img
                              src={locationData[selectedPlanData.hero.title].photo_url}
                              alt={selectedPlanData.hero.title}
                              className="w-full h-48 object-cover rounded-lg shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 mt-0.5">📍</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">住所</p>
                            <p className="text-sm text-gray-600">
                              {locationData[selectedPlanData.hero.title].formatted_address}
                            </p>
                          </div>
                        </div>
                        {locationData[selectedPlanData.hero.title].coordinates && (
                          <div className="flex items-start space-x-2 mt-3">
                            <span className="text-green-600 mt-0.5">🌐</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">座標</p>
                              <p className="text-sm text-gray-600">
                                {locationData[selectedPlanData.hero.title].coordinates.lat.toFixed(6)}, {locationData[selectedPlanData.hero.title].coordinates.lng.toFixed(6)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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