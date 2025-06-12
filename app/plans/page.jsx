"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMockPlans } from "../../data/mockData";
import { getLocationData, extractLocationsFromPlan, getMultipleLocationsData, enrichPlanWithLocationData } from "../../utils/locationUtils";
import InteractiveMap from "../../components/InteractiveMap";

export default function PlansPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(0);
  const [plans, setPlans] = useState(getMockPlans());
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState({});
  const [locationData, setLocationData] = useState({});
  const [activityImages, setActivityImages] = useState({});
  const [routeData, setRouteData] = useState({});

  // 位置情報とホテル情報を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const mockPlans = getMockPlans();
        
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
        const hotelPromises = mockPlans.map(async (plan) => {
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
        
        for (const plan of mockPlans) {
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

        for (const plan of mockPlans) {
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
  }, []);

  const handlePlanSelect = (planIndex) => {
    router.push(`/plan/${plans[planIndex].trip_id}`);
  };

  const handleRegenerate = () => {
    // デモ用: 簡単な確認後にランディングページに戻る
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
                          {day.activities.map((activity) => {
                            const activityImageData = activityImages[plan.trip_id]?.[activity.id];
                            const imageUrl = activityImageData?.photo_url || activity.image;
                            
                            return (
                            <div key={activity.id} className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg">
                              <img
                                src={imageUrl}
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
                          );
                          })}
                        </div>

                        {/* 1日の経路マップ */}
                        {routeData[plan.trip_id]?.[`day_${day.day}`] && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                              <span className="mr-2">🗺️</span>
                              Day {day.day} の移動ルート
                            </h5>
                            <InteractiveMap
                              staticMapUrl={routeData[plan.trip_id][`day_${day.day}`].static_map_url}
                              routeInfo={routeData[plan.trip_id][`day_${day.day}`].route}
                              height="250px"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Interactive Route Map */}
                  {routeData[plan.trip_id]?.overall && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">全体旅行ルート</h3>
                      <div className="bg-white rounded-xl shadow-md p-6">
                        <InteractiveMap
                          staticMapUrl={routeData[plan.trip_id].overall.static_map_url}
                          routeInfo={routeData[plan.trip_id].overall.route}
                          height="300px"
                        />
                      </div>
                    </div>
                  )}

                  {/* Recommended Hotels */}
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">おすすめホテル</h3>
                    {hotels[plan.trip_id] && hotels[plan.trip_id].length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {hotels[plan.trip_id].map((hotel) => (
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
                  {locationData[plan.hero.title] && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">エリア情報</h3>
                      <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {locationData[plan.hero.title].map_image_url && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <span className="mr-2">🗺️</span>
                                位置情報
                              </h4>
                              <div className="relative group">
                                <img
                                  src={locationData[plan.hero.title].map_image_url}
                                  alt={`${plan.hero.title}の地図`}
                                  className="w-full h-48 object-cover rounded-lg cursor-pointer group-hover:opacity-90 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
                                  <span className="text-white font-medium">Google Mapsで開く</span>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.hero.title)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute inset-0"
                                >
                                  <span className="sr-only">Google Mapsで{plan.hero.title}を開く</span>
                                </a>
                              </div>
                            </div>
                          )}
                          {locationData[plan.hero.title].photo_url && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <span className="mr-2">📸</span>
                                現地の風景
                              </h4>
                              <img
                                src={locationData[plan.hero.title].photo_url}
                                alt={plan.hero.title}
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
                                {locationData[plan.hero.title].formatted_address}
                              </p>
                            </div>
                          </div>
                          {locationData[plan.hero.title].coordinates && (
                            <div className="flex items-start space-x-2 mt-3">
                              <span className="text-green-600 mt-0.5">🌐</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">座標</p>
                                <p className="text-sm text-gray-600">
                                  {locationData[plan.hero.title].coordinates.lat.toFixed(6)}, {locationData[plan.hero.title].coordinates.lng.toFixed(6)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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