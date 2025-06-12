// Google Maps APIから位置情報を取得するユーティリティ関数
export async function getLocationData(location) {
  try {
    const response = await fetch('/api/google-maps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) {
      throw new Error(`Google Maps API エラー: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('位置情報の取得に失敗:', error);
    return null;
  }
}

// 複数の位置情報を一括取得する関数
export async function getMultipleLocationsData(locations) {
  const promises = locations.map(location => getLocationData(location));
  const results = await Promise.all(promises);
  
  // 結果をオブジェクトにマッピング
  const locationMap = {};
  locations.forEach((location, index) => {
    locationMap[location] = results[index];
  });
  
  return locationMap;
}

// プランデータから場所のリストを抽出する関数
export function extractLocationsFromPlan(plan) {
  const locations = new Set();
  
  // 主要な目的地を追加（hero.titleを使用）
  if (plan.hero && plan.hero.title) {
    locations.add(plan.hero.title);
  }
  
  // 各日の都市を追加
  if (plan.itinerary) {
    plan.itinerary.forEach(day => {
      if (day.city && day.city.name) {
        locations.add(day.city.name);
      }
      
      // アクティビティの場所を追加
      if (day.activities) {
        day.activities.forEach(activity => {
          if (activity.location) {
            locations.add(activity.location);
          }
        });
      }
    });
  }
  
  return Array.from(locations);
}

// プランデータに位置情報を統合する関数
export function enrichPlanWithLocationData(plan, locationData) {
  const enrichedPlan = { ...plan };
  
  // 各日の都市に位置情報を追加
  if (enrichedPlan.itinerary) {
    enrichedPlan.itinerary = enrichedPlan.itinerary.map(day => {
      const enrichedDay = { ...day };
      
      if (day.city && day.city.name && locationData[day.city.name]) {
        enrichedDay.city = {
          ...day.city,
          location_data: locationData[day.city.name]
        };
      }
      
      // アクティビティに位置情報を追加
      if (day.activities) {
        enrichedDay.activities = day.activities.map(activity => {
          const enrichedActivity = { ...activity };
          
          if (activity.location && locationData[activity.location]) {
            enrichedActivity.location_data = locationData[activity.location];
          }
          
          return enrichedActivity;
        });
      }
      
      return enrichedDay;
    });
  }
  
  return enrichedPlan;
}