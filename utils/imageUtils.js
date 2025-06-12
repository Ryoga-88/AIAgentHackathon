// 画像検索用のユーティリティ関数

export async function fetchActivityImage(cityName, activityTitle, activityEnglish) {
  try {
    // 検索クエリを作成 (英語での検索が効果的)
    const searchQuery = activityEnglish 
      ? `${cityName} ${activityEnglish} Japan tourism`
      : `${cityName} ${activityTitle} Japan`;
    
    const response = await fetch(`/api/search-images?q=${encodeURIComponent(searchQuery)}`);
    
    if (!response.ok) {
      console.warn(`画像検索失敗: ${searchQuery}`);
      return null;
    }
    
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("画像取得エラー:", error);
    return null;
  }
}

// 複数のアクティビティの画像を並行取得
export async function fetchImagesForActivities(activities, cityName) {
  const imagePromises = activities.map(async (activity) => {
    const imageUrl = await fetchActivityImage(
      cityName, 
      activity.title, 
      activity.activity_english
    );
    
    return {
      ...activity,
      imageUrl: imageUrl
    };
  });
  
  return await Promise.all(imagePromises);
}

// 旅行プラン全体の画像を取得
export async function fetchImagesForTravelPlan(travelPlan) {
  const updatedItinerary = await Promise.all(
    travelPlan.itinerary.map(async (day) => {
      const activitiesWithImages = await fetchImagesForActivities(
        day.activities, 
        day.city.name_en || day.city.name
      );
      
      return {
        ...day,
        activities: activitiesWithImages
      };
    })
  );
  
  return {
    ...travelPlan,
    itinerary: updatedItinerary
  };
}