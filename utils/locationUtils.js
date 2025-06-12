// Google Maps APIから位置情報を取得するユーティリティ関数
export async function getLocationData(location) {
  try {
    console.log(`位置情報を取得中: ${location}`);
    const response = await fetch('/api/google-maps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) {
      console.error(`Google Maps API エラー: ${response.status} for location: ${location}`);
      throw new Error(`Google Maps API エラー: ${response.status}`);
    }

    const data = await response.json();
    console.log(`位置情報取得成功: ${location}`, data);
    return data;
  } catch (error) {
    console.error(`位置情報の取得に失敗 (${location}):`, error);
    throw error;
  }
}

// 複数の位置情報を一括取得する関数
export async function getMultipleLocationsData(locations) {
  console.log('一括位置情報取得開始:', locations);
  
  const results = await Promise.allSettled(
    locations.map(async (location) => {
      try {
        const data = await getLocationData(location);
        return { location, data, success: true };
      } catch (error) {
        console.error(`位置情報取得失敗 - ${location}:`, error.message);
        return { location, error: error.message, success: false };
      }
    })
  );
  
  // 結果をオブジェクトにマッピング
  const locationMap = {};
  results.forEach((result, index) => {
    const location = locations[index];
    if (result.status === 'fulfilled' && result.value.success) {
      locationMap[location] = result.value.data;
    } else {
      console.warn(`位置情報スキップ: ${location} - ${result.value?.error || result.reason}`);
      // エラーが発生した位置情報は空のオブジェクトで代替
      locationMap[location] = null;
    }
  });
  
  console.log('位置情報取得完了:', Object.keys(locationMap).filter(key => locationMap[key] !== null));
  return locationMap;
}

// 位置情報の前処理：曖昧な位置情報を具体的にする
function preprocessLocation(location, plan) {
  // 基本的な置換ルール
  const replacements = {
    '市内の人気カフェ': plan?.hero?.destination ? `${plan.hero.destination} カフェ` : '日本 カフェ',
    '市内の郷土料理店': plan?.hero?.destination ? `${plan.hero.destination} 郷土料理` : '日本 郷土料理',
    '地元の': plan?.hero?.destination ? `${plan.hero.destination} ` : '日本 ',
    '市内の': plan?.hero?.destination ? `${plan.hero.destination} ` : '日本 ',
    '地域の': plan?.hero?.destination ? `${plan.hero.destination} ` : '日本 ',
    '周辺の': plan?.hero?.destination ? `${plan.hero.destination} ` : '日本 '
  };

  let processedLocation = location;
  
  // 置換ルールを適用
  for (const [pattern, replacement] of Object.entries(replacements)) {
    if (processedLocation.includes(pattern)) {
      processedLocation = processedLocation.replace(pattern, replacement);
      break;
    }
  }

  if (processedLocation !== location) {
    console.log(`位置情報前処理: "${location}" -> "${processedLocation}"`);
  }
  return processedLocation;
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
      
      // アクティビティの場所を追加（前処理付き）
      if (day.activities) {
        day.activities.forEach(activity => {
          if (activity.location) {
            const processedLocation = preprocessLocation(activity.location, plan);
            locations.add(processedLocation);
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