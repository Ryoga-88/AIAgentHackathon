"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMockPlans } from "../../data/mockData";
import { getLocationData, extractLocationsFromPlan, getMultipleLocationsData, enrichPlanWithLocationData } from "../../utils/locationUtils";
import InteractiveMap from "../../components/InteractiveMap";
import { useAuth } from "../../contexts/AuthContext";
import UserProfile from "../../components/Auth/UserProfile";
import BlurredContent from "../../components/BlurredContent";

export default function PlansPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState({});
  const [locationData, setLocationData] = useState({});
  const [activityImages, setActivityImages] = useState({});
  const [heroImages, setHeroImages] = useState({});
  const [dayImages, setDayImages] = useState({});
  const [routeData, setRouteData] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [hasStoredPlans, setHasStoredPlans] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  // クライアントサイドレンダリングの確認とプランデータの存在確認
  useEffect(() => {
    setIsClient(true);
    const storedPlans = localStorage.getItem('travelPlans');
    
    if (storedPlans) {
      setHasStoredPlans(true);
    } else {
      // プランデータがない場合はホームページにリダイレクト
      router.push('/');
      return;
    }
  }, [router]);

  // LLMの出力データまたはローカルストレージからプランを取得
  useEffect(() => {
    if (!isClient || !hasStoredPlans) return; // クライアント側でプランデータがある場合のみ実行
    
    const fetchPlans = async () => {
      if (loading) { // 既にローディング中の場合は実行しない
        try {
          // まずローカルストレージから最新のプランを確認
          const storedPlans = localStorage.getItem('travelPlans');
          
          if (storedPlans) {
            const parsedPlans = JSON.parse(storedPlans);
            
            // 新しい形式（日付情報を含む）の場合
            if (parsedPlans.plans && Array.isArray(parsedPlans.plans)) {
              setPlans(parsedPlans.plans);
              // 日付情報が含まれている場合は状態にセット
              if (parsedPlans.travelDates) {
                setStartDate(parsedPlans.travelDates.startDate || '');
                setEndDate(parsedPlans.travelDates.endDate || '');
              }
            } else if (Array.isArray(parsedPlans)) {
              // 古い形式（プランのみの配列）の場合
              setPlans(parsedPlans);
            } else {
              // 単一プランの場合は配列に変換
              setPlans([parsedPlans]);
            }
          } else {
            // ローカルストレージにデータがない場合はMockデータを使用
            const mockPlans = getMockPlans();
            setPlans(mockPlans);
          }
        } catch (error) {
          console.error('プランの取得に失敗:', error);
          // エラー時はMockデータを使用
          const mockPlans = getMockPlans();
          setPlans(mockPlans);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPlans();
  }, [isClient, hasStoredPlans, loading]); // 依存配列を適切に設定

  // 位置情報とホテル情報を取得
  useEffect(() => {
    if (plans.length === 0 || !isClient) return;

    const fetchData = async () => {
      try {
        // plansが有効であることを確認
        if (!plans || !Array.isArray(plans) || plans.length === 0) {
          console.warn('プランデータが無効です:', plans);
          setLoading(false);
          return;
        }

        const mockPlans = plans;
        
        // 全プランから位置情報を抽出
        const allLocations = new Set();
        mockPlans.forEach(plan => {
          const locations = extractLocationsFromPlan(plan);
          locations.forEach(loc => allLocations.add(loc));
        });

        // 位置情報を一括取得
        const locationsArray = Array.from(allLocations);
        console.log('取得する位置情報:', locationsArray);
        
        let locationResults = {};
        try {
          locationResults = await getMultipleLocationsData(locationsArray);
          console.log('位置情報取得結果:', locationResults);
          setLocationData(locationResults);
        } catch (error) {
          console.error('位置情報取得に失敗:', error);
          // エラーが発生してもアプリケーションを継続
          setLocationData({});
        }

        // 各プランの主要都市でホテルを並行検索（パフォーマンス改善）
        const hotelPromises = plans.filter(plan => plan && plan.hero && plan.hero.title).map(async (plan) => {
          const mainDestination = plan.hero.title;
          const locationData = locationResults[mainDestination];
          
          // 日程の設定（今日から1週間後〜3日間の滞在）
          const today = new Date();
          const checkin = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 1週間後
          const checkout = new Date(checkin.getTime() + 3 * 24 * 60 * 60 * 1000); // 3日間の滞在
          
          const checkinStr = checkin.toISOString().split('T')[0];
          const checkoutStr = checkout.toISOString().split('T')[0];
          
          if (locationData && locationData.coordinates) {
            try {
              console.log(`ホテル検索中: ${mainDestination}`, {
                coordinates: locationData.coordinates,
                checkin: checkinStr,
                checkout: checkoutStr
              });
              
              const hotelResponse = await fetch('/api/search-hotels', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  checkin: checkinStr,
                  checkout: checkoutStr,
                  adults: 2,
                  searchType: 'coordinates',
                  coordinates: locationData.coordinates
                }),
              });

              if (hotelResponse.ok) {
                const hotelData = await hotelResponse.json();
                console.log(`ホテル検索成功 (${mainDestination}):`, hotelData);
                return { trip_id: plan.trip_id, results: hotelData.results };
              } else {
                console.error(`ホテル検索失敗 (${mainDestination}):`, hotelResponse.status);
              }
            } catch (error) {
              console.error(`ホテル検索エラー (${plan.trip_id}):`, error);
            }
          } else {
            // 座標がない場合は地名で検索
            try {
              console.log(`ホテル検索（地名）: ${mainDestination}`);
              const hotelResponse = await fetch('/api/search-hotels', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  checkin: checkinStr,
                  checkout: checkoutStr,
                  adults: 2,
                  searchType: 'location',
                  location: mainDestination
                }),
              });

              if (hotelResponse.ok) {
                const hotelData = await hotelResponse.json();
                console.log(`ホテル検索成功（地名）(${mainDestination}):`, hotelData);
                return { trip_id: plan.trip_id, results: hotelData.results };
              }
            } catch (error) {
              console.error(`ホテル検索エラー（地名）(${plan.trip_id}):`, error);
            }
          }
          return { trip_id: plan.trip_id, results: [] };
        });

        // ホテル情報を設定
        try {
          const hotelResults = {};
          const hotelResponses = await Promise.all(hotelPromises);
          hotelResponses.forEach(response => {
            hotelResults[response.trip_id] = response.results;
          });
          console.log('ホテル検索結果:', hotelResults);
          setHotels(hotelResults);
        } catch (error) {
          console.error('ホテル情報取得に失敗:', error);
          // エラーが発生してもアプリケーションを継続
          setHotels({});
        }

        // プランのヒーロー画像を並行取得
        const heroImagePromises = [];
        const heroImageResults = {};
        
        for (const plan of plans.filter(p => p && p.hero && p.hero.title)) {
          console.log(`ヒーロー画像取得開始: ${plan.hero.title} (Trip: ${plan.trip_id})`);
          
          const promise = fetch('/api/places-photos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              placeName: plan.hero.title
            }),
          })
          .then(async (response) => {
            console.log(`ヒーロー画像レスポンス (${plan.hero.title}):`, response.status);
            if (response.ok) {
              const imageData = await response.json();
              console.log(`ヒーロー画像取得成功 (${plan.hero.title}):`, imageData);
              return { 
                trip_id: plan.trip_id, 
                data: imageData 
              };
            } else {
              const errorData = await response.json().catch(() => ({ error: '不明なエラー' }));
              console.warn(`ヒーロー画像取得失敗 (${plan.hero.title}):`, response.status, errorData);
            }
            return null;
          })
          .catch((error) => {
            console.error(`ヒーロー画像取得エラー (${plan.hero.title}):`, error);
            return null;
          });
          
          heroImagePromises.push(promise);
        }

        // 各日のヘッダー画像を並行取得
        const dayImagePromises = [];
        const dayImageResults = {};
        
        for (const plan of plans.filter(p => p && p.itinerary && Array.isArray(p.itinerary))) {
          dayImageResults[plan.trip_id] = {};
          
          for (const day of plan.itinerary.filter(d => d && d.city && d.city.name)) {
            console.log(`日程画像取得開始: ${day.city.name} (Trip: ${plan.trip_id}, Day: ${day.day})`);
            
            const promise = fetch('/api/places-photos', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                placeName: day.city.name
              }),
            })
            .then(async (response) => {
              console.log(`日程画像レスポンス (${day.city.name}):`, response.status);
              if (response.ok) {
                const imageData = await response.json();
                console.log(`日程画像取得成功 (${day.city.name}):`, imageData);
                return { 
                  trip_id: plan.trip_id, 
                  day: day.day,
                  data: imageData 
                };
              } else {
                const errorData = await response.json().catch(() => ({ error: '不明なエラー' }));
                console.warn(`日程画像取得失敗 (${day.city.name}):`, response.status, errorData);
              }
              return null;
            })
            .catch((error) => {
              console.error(`日程画像取得エラー (${day.city.name}):`, error);
              return null;
            });
            
            dayImagePromises.push(promise);
          }
        }

        // アクティビティの画像を並行取得（パフォーマンス改善）
        const activityImagePromises = [];
        const activityImageResults = {};
        
        for (const plan of plans.filter(p => p && p.itinerary && Array.isArray(p.itinerary))) {
          activityImageResults[plan.trip_id] = {};
          
          for (const day of plan.itinerary.filter(d => d && d.activities && Array.isArray(d.activities))) {
            for (const activity of day.activities.filter(a => a && a.title && a.id)) {
              console.log(`画像取得開始: ${activity.title} (Trip: ${plan.trip_id}, Activity: ${activity.id})`);
              
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
                console.log(`画像取得レスポンス (${activity.title}):`, response.status, response.statusText);
                if (response.ok) {
                  const imageData = await response.json();
                  console.log(`画像取得成功 (${activity.title}):`, imageData);
                  return { 
                    trip_id: plan.trip_id, 
                    activity_id: activity.id, 
                    data: imageData 
                  };
                } else {
                  const errorData = await response.json().catch(() => ({ error: '不明なエラー' }));
                  console.warn(`画像取得失敗 (${activity.title}):`, response.status, errorData);
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

        // ヒーロー画像を設定
        try {
          const heroImageResponses = await Promise.all(heroImagePromises);
          heroImageResponses.forEach(response => {
            if (response) {
              heroImageResults[response.trip_id] = response.data;
            }
          });
          console.log('ヒーロー画像取得結果:', heroImageResults);
          setHeroImages(heroImageResults);
        } catch (error) {
          console.error('ヒーロー画像取得に失敗:', error);
          setHeroImages({});
        }

        // 日程画像を設定
        try {
          const dayImageResponses = await Promise.all(dayImagePromises);
          dayImageResponses.forEach(response => {
            if (response) {
              dayImageResults[response.trip_id][response.day] = response.data;
            }
          });
          console.log('日程画像取得結果:', dayImageResults);
          setDayImages(dayImageResults);
        } catch (error) {
          console.error('日程画像取得に失敗:', error);
          setDayImages({});
        }

        // アクティビティ画像を設定
        try {
          const activityImageResponses = await Promise.all(activityImagePromises);
          activityImageResponses.forEach(response => {
            if (response) {
              activityImageResults[response.trip_id][response.activity_id] = response.data;
            }
          });
          console.log('アクティビティ画像取得結果:', activityImageResults);
          setActivityImages(activityImageResults);
        } catch (error) {
          console.error('アクティビティ画像取得に失敗:', error);
          // エラーが発生してもアプリケーションを継続
          setActivityImages({});
        }

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
              console.log(`Day ${day.day} ルート取得中 (${plan.trip_id}):`, dailyWaypoints);
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
                  console.log(`Day ${day.day} ルート取得成功 (${plan.trip_id}):`, routeData);
                  return { trip_id: plan.trip_id, type: `day_${day.day}`, data: routeData };
                }
                console.error(`Day ${day.day} ルート取得失敗 (${plan.trip_id}):`, response.status);
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

        // 経路情報を設定
        try {
          const routeResponses = await Promise.all(routePromises);
          routeResponses.forEach(response => {
            if (response) {
              routeResults[response.trip_id][response.type] = response.data;
            }
          });
          console.log('ルート取得結果:', routeResults);
          setRouteData(routeResults);
        } catch (error) {
          console.error('ルート情報取得に失敗:', error);
          // エラーが発生してもアプリケーションを継続
          setRouteData({});
        }
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
  };

  const handleConfirmPlan = () => {
    if (startDate && endDate) {
      // 日程が設定されている場合、その情報を含めて確定画面に遷移
      const planWithDates = {
        ...selectedPlanData,
        travel_dates: {
          startDate: startDate,
          endDate: endDate,
          duration: (() => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            return `${days}日間`;
          })()
        }
      };
      localStorage.setItem('selectedPlanWithDates', JSON.stringify(planWithDates));
      console.log('プラン確定（日程あり）:', planWithDates);
    } else {
      // 日程が未設定の場合は元のプランデータのみ
      localStorage.setItem('selectedPlanWithDates', JSON.stringify(selectedPlanData));
      console.log('プラン確定（日程なし）:', selectedPlanData);
    }
    router.push('/confirm');
  };

  const handleDateConfirm = () => {
    if (!startDate || !endDate) {
      alert('出発日と帰着日を両方選択してください。');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      alert('帰着日は出発日より後の日付を選択してください。');
      return;
    }
    
    // 日程の差を計算
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const planDuration = selectedPlanData?.hero?.duration || '';
    const expectedDays = parseInt(planDuration.match(/\d+/)?.[0]) || 0;
    
    if (daysDiff !== expectedDays && expectedDays > 0) {
      if (!confirm(`プランは${expectedDays}日間ですが、選択された期間は${daysDiff}日間です。このまま続行しますか？`)) {
        return;
      }
    }
    
    setShowDatePicker(false);
    alert(`旅行日程が設定されました: ${startDate} 〜 ${endDate}`);
  };

  const handleRegenerate = () => {
    if (confirm('新しいプランを生成しますか？')) {
      router.push('/');
    }
  };

  const handleRegenerateWithPrompt = async () => {
    if (!additionalPrompt.trim()) {
      alert('追加の要望を入力してください。');
      return;
    }

    try {
      // 現在のプランデータと追加プロンプトを組み合わせて新しいプランを生成
      const response = await fetch('/api/modify-travel-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_plan: selectedPlanData,
          plan_number: selectedPlan + 1,
          modification_request: additionalPrompt,
          full_plans_data: plans
        }),
      });

      if (response.ok) {
        const newPlans = await response.json();
        localStorage.setItem('travelPlans', JSON.stringify(newPlans));
        // ページをリロードして新しいプランを表示
        window.location.reload();
      } else {
        alert('プランの生成に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('プラン再生成エラー:', error);
      alert('プランの生成中にエラーが発生しました。');
    }

    setShowRegenerateForm(false);
    setAdditionalPrompt('');
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

  const handleBookingClick = (type) => {
    console.log(`${type}の予約を開始`);
  };

  const selectedPlanData = selectedPlan !== null ? plans[selectedPlan] : null;

  // SSR中またはプランデータがない場合のローディング表示
  if (!isClient || authLoading || !hasStoredPlans) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">
            {!isClient ? "読み込み中..." : authLoading ? "認証状態を確認中..." : "プランデータを確認中..."}
          </p>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRegenerate}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                新しいプランを生成
              </button>
              <UserProfile />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ユーザー向け案内 - 未認証時 */}
        {!currentUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">ℹ️</div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">プランが生成されました！</h3>
                <p className="text-blue-800 text-sm mb-3">
                  プランの概要はご覧いただけますが、詳細な情報（ホテル、ルート、アクティビティの詳細など）を見るにはログインが必要です。
                </p>
                <button
                  onClick={() => router.push('/login?redirect=%2Fplans')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  ログインして詳細を見る
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans && plans.length > 0 ? (
            plans.filter(plan => plan && plan.hero).map((plan, index) => (
              <div
                key={plan.trip_id || index}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                  selectedPlan === index ? 'ring-4 ring-blue-500 ring-opacity-50' : 'hover:shadow-xl'
                }`}
                onClick={() => handlePlanSelect(index)}
              >
              <div className="relative h-48">
                  <img
                    src={heroImages[plan.trip_id]?.photo_url || plan.hero?.hero_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop'}
                    alt={plan.hero?.title || 'プラン画像'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = plan.hero?.hero_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-bold text-white mb-1">{plan.hero?.title || 'プラン名未設定'}</h3>
                    <p className="text-gray-200 text-sm">{plan.hero?.subtitle || ''}</p>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-blue-600 font-semibold">{plan.hero?.duration || '期間未設定'}</span>
                    <span className="text-purple-600 font-semibold">{plan.hero?.budget || '予算未設定'}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(plan.hero?.highlights || []).slice(0, 2).map((highlight, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {highlight}
                      </span>
                    ))}
                    {(plan.hero?.highlights || []).length > 2 && (
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        +{(plan.hero?.highlights || []).length - 2}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">📍 {plan.hero?.destination || '目的地未設定'}</span>
                    {selectedPlan === index && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                        選択中
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-500">プランデータを読み込み中...</p>
            </div>
          )}
        </div>

        {/* Selected Plan Details */}
        {selectedPlanData && (
          <BlurredContent isAuthenticated={!!currentUser} title="詳細なプラン">
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
                        src={dayImages[selectedPlanData.trip_id]?.[day.day]?.photo_url || day.city.image}
                        alt={day.city.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = day.city.image; // フォールバック
                        }}
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
                                  src={activityImages[selectedPlanData.trip_id]?.[activity.id]?.photo_url || activity.image}
                                  alt={activity.title}
                                  className="w-full h-32 sm:h-36 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.src = activity.image; // フォールバック
                                  }}
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
                {/* Plan Summary */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 プラン概要</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">期間</span>
                      {startDate && endDate ? (
                        <div className="text-right">
                          <div className="font-medium text-blue-600">
                            {new Date(startDate).toLocaleDateString('ja-JP', {
                              month: 'short',
                              day: 'numeric'
                            })} 〜 {new Date(endDate).toLocaleDateString('ja-JP', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(() => {
                              const start = new Date(startDate);
                              const end = new Date(endDate);
                              const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                              return `${days}日間の旅程`;
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="font-medium">{selectedPlanData.hero.duration}</span>
                          <div className="text-xs text-gray-500">
                            日程未設定
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">予算目安</span>
                      <span className="font-medium">{selectedPlanData.hero.budget}</span>
                    </div>
                    {startDate && endDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">旅行日程</span>
                        <span className="font-medium text-blue-600">{startDate} 〜 {endDate}</span>
                      </div>
                    )}
                  </div>

                  {/* 日程選択フォーム */}
                  {showDatePicker && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">旅行日程を選択</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            出発日
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            帰着日
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleDateConfirm}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            確定
                          </button>
                          <button
                            onClick={() => setShowDatePicker(false)}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
              </div>
            </div>
          </div>

          {/* 新たなプラン生成フォーム */}
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">✨</span>
                プランをカスタマイズ
              </h3>
              <p className="text-gray-600 mb-6">
                現在のプランをベースに、あなたの追加の要望を反映した新しいプランを生成できます。
              </p>
              
              {!showRegenerateForm ? (
                <button
                  onClick={() => setShowRegenerateForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center"
                >
                  <span className="mr-2">🎯</span>
                  プランをカスタマイズする
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      追加の要望やリクエスト
                    </label>
                    <textarea
                      value={additionalPrompt}
                      onChange={(e) => setAdditionalPrompt(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows="4"
                      placeholder="例: もっと自然を楽しめるスポットを追加してください、予算を抑えたい、子供向けの施設を含めてください、など"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleRegenerateWithPrompt}
                      disabled={!additionalPrompt.trim()}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                    >
                      <span className="mr-2">🚀</span>
                      新しいプランを生成
                    </button>
                    <button
                      onClick={() => {
                        setShowRegenerateForm(false);
                        setAdditionalPrompt('');
                      }}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </BlurredContent>
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