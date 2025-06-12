"use client";
import { useState, useEffect } from 'react';

export default function CostBreakdown({ plan, routeData, hotels }) {
  const [costs, setCosts] = useState({
    transportation: 0,
    accommodation: 0,
    activities: 0,
    food: 0,
    total: 0
  });

  useEffect(() => {
    calculateCosts();
  }, [plan, routeData, hotels]);

  const calculateTransportationCost = () => {
    console.log('💰 交通費計算開始:', {
      routeData: routeData,
      overall: routeData?.overall,
      route: routeData?.overall?.route,
      total_cost: routeData?.overall?.route?.total_cost,
      distance_km: routeData?.overall?.route?.distance_km
    });

    // 全体の総移動距離から計算
    if (routeData?.overall?.route?.total_cost) {
      console.log('✅ 事前計算された交通費を使用:', routeData.overall.route.total_cost);
      return routeData.overall.route.total_cost;
    }
    
    // フォールバック: 従来の計算方法
    if (routeData?.overall?.route?.distance_km) {
      const route = routeData.overall.route;
      const totalDistance = route.distance_km || 0;
      
      // 現実的な交通費計算（1kmあたり約28円）
      const costPerKm = 28;
      const estimatedCost = Math.round(totalDistance * costPerKm);
      
      console.log('✅ 距離から交通費を計算:', {
        distance: totalDistance,
        cost: estimatedCost
      });
      
      return estimatedCost;
    }

    console.log('⚠️ 交通費計算不可 - データ不足');
    return 0;
  };

  const calculateCosts = () => {
    if (!plan || !plan.itinerary) return;

    let transportationCost = 0;
    let accommodationCost = 0;
    let activitiesCost = 0;
    let foodCost = 0;

    // 交通費計算（経路データから）
    transportationCost = calculateTransportationCost();

    // 宿泊費計算
    plan.itinerary.forEach((day) => {
      if (day.accommodation && day.accommodation !== "出発日のため宿泊なし") {
        const dayHotels = hotels && hotels[`day_${day.day}`];
        if (dayHotels && dayHotels.length > 0) {
          // 最低価格のホテルを基準に計算
          const minPrice = Math.min(...dayHotels.map(hotel => {
            const price = hotel.price.replace(/[^\d]/g, '');
            return parseInt(price) || 8000;
          }));
          accommodationCost += minPrice;
        } else {
          // デフォルト宿泊費（1泊8,000円）
          accommodationCost += 8000;
        }
      }
    });

    // アクティビティ費計算
    plan.itinerary.forEach((day) => {
      day.activities.forEach((activity) => {
        if (activity.price) {
          const price = activity.price.replace(/[^\d]/g, '');
          const activityPrice = parseInt(price) || 0;
          activitiesCost += activityPrice;
          
          // 食事関連の場合は食費に分類
          if (activity.category === 'food' || activity.type === 'culinary') {
            foodCost += activityPrice;
            activitiesCost -= activityPrice;
          }
        }
      });
    });

    // 食費の追加計算（1日あたり3,000円の基本食費）
    const basicFoodCost = plan.itinerary.length * 3000;
    foodCost += basicFoodCost;

    const total = transportationCost + accommodationCost + activitiesCost + foodCost;

    setCosts({
      transportation: transportationCost,
      accommodation: accommodationCost,
      activities: activitiesCost,
      food: foodCost,
      total: total
    });
  };

  const formatCurrency = (amount) => {
    return `¥${amount.toLocaleString()}`;
  };

  const getPercentage = (amount) => {
    return costs.total > 0 ? Math.round((amount / costs.total) * 100) : 0;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 費用詳細</h3>
      
      <div className="space-y-4">
        {/* 交通費 */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-blue-600 mr-2">🚗</span>
            <div>
              <div className="font-medium text-gray-900">交通費</div>
              <div className="text-xs text-gray-500">{getPercentage(costs.transportation)}%</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-blue-600">{formatCurrency(costs.transportation)}</div>
          </div>
        </div>

        {/* 宿泊費 */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-purple-600 mr-2">🏨</span>
            <div>
              <div className="font-medium text-gray-900">宿泊費</div>
              <div className="text-xs text-gray-500">{getPercentage(costs.accommodation)}%</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-purple-600">{formatCurrency(costs.accommodation)}</div>
          </div>
        </div>

        {/* アクティビティ費 */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">🎯</span>
            <div>
              <div className="font-medium text-gray-900">観光・体験</div>
              <div className="text-xs text-gray-500">{getPercentage(costs.activities)}%</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-green-600">{formatCurrency(costs.activities)}</div>
          </div>
        </div>

        {/* 食費 */}
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-orange-600 mr-2">🍜</span>
            <div>
              <div className="font-medium text-gray-900">食費</div>
              <div className="text-xs text-gray-500">{getPercentage(costs.food)}%</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-orange-600">{formatCurrency(costs.food)}</div>
          </div>
        </div>

        {/* 合計 */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center">
              <span className="text-gray-700 mr-2">💸</span>
              <div className="font-bold text-gray-900">合計費用</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(costs.total)}</div>
              <div className="text-xs text-gray-500">1人あたり</div>
            </div>
          </div>
        </div>

        {/* コスト内訳グラフ */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">費用内訳</h4>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-blue-500 h-full float-left"
              style={{ width: `${getPercentage(costs.transportation)}%` }}
            ></div>
            <div 
              className="bg-purple-500 h-full float-left"
              style={{ width: `${getPercentage(costs.accommodation)}%` }}
            ></div>
            <div 
              className="bg-green-500 h-full float-left"
              style={{ width: `${getPercentage(costs.activities)}%` }}
            ></div>
            <div 
              className="bg-orange-500 h-full float-left"
              style={{ width: `${getPercentage(costs.food)}%` }}
            ></div>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          ※ 概算費用です。実際の料金は時期や予約タイミングにより変動します。
        </div>
      </div>

      {/* 交通費詳細 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-md font-semibold text-blue-700 mb-3">交通費詳細</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">総移動距離</span>
            <span className="font-medium">
              {routeData?.overall?.route?.distance_km ? 
                `${Math.round(routeData.overall.route.distance_km * 10) / 10} km` : 
                '計算中...'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">総移動時間</span>
            <span className="font-medium">
              {routeData?.overall?.route?.duration_minutes ? 
                routeData.overall.route.duration_minutes >= 60 ? 
                  `${Math.floor(routeData.overall.route.duration_minutes / 60)}時間${routeData.overall.route.duration_minutes % 60}分` :
                  `${routeData.overall.route.duration_minutes}分`
                : '計算中...'}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-600 font-medium">総交通費</span>
            <span className="font-bold text-blue-700">¥{calculateTransportationCost().toLocaleString()}</span>
          </div>
          <div className="text-xs text-gray-500">
            ※ ガソリン代・高速道路代込み（1kmあたり¥28で計算）
          </div>
        </div>
      </div>
    </div>
  );
}
