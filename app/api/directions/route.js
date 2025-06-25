import { NextResponse } from 'next/server';

// 最大許容距離（メートル）
const MAX_DISTANCE_METERS = 50000; // 50km
const MAX_DURATION_SECONDS = 3600; // 1時間

// 距離ベースの類似地点を検索する関数
async function findNearbyAlternatives(location, maxRadius = 10000) {
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!GOOGLE_MAPS_API_KEY) return [];
  
  try {
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(location)}&radius=${maxRadius}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(placesUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results.slice(0, 3).map(place => ({
        name: place.name,
        formatted_address: place.formatted_address,
        location: place.geometry.location,
        rating: place.rating || 0
      }));
    }
    return [];
  } catch (error) {
    console.error('代替地点検索エラー:', error);
    return [];
  }
}

export async function POST(request) {
  try {
    const { waypoints } = await request.json();
    console.log('Directions API リクエスト:', waypoints);

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      console.error('不正なwaypoints:', waypoints);
      return NextResponse.json(
        { error: 'At least 2 waypoints are required', waypoints },
        { status: 400 }
      );
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }

    // Google Directions APIを呼び出し
    const origin = encodeURIComponent(waypoints[0]);
    const destination = encodeURIComponent(waypoints[waypoints.length - 1]);
    const waypointsParam = waypoints.slice(1, -1).length > 0 
      ? `&waypoints=${waypoints.slice(1, -1).map(w => encodeURIComponent(w)).join('|')}`
      : '';

    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointsParam}&key=${GOOGLE_MAPS_API_KEY}`;

    const directionsResponse = await fetch(directionsUrl);
    const directionsData = await directionsResponse.json();

    if (directionsData.status !== 'OK') {
      console.error('Directions API エラー:', directionsData.status, directionsData.error_message, 'waypoints:', waypoints);
      return NextResponse.json(
        { error: 'Failed to get directions', details: directionsData.error_message, status: directionsData.status, waypoints },
        { status: 400 }
      );
    }

    console.log('Directions API 成功:', waypoints);

    // Static Map URLを生成
    const route = directionsData.routes[0];
    const encodedPolyline = route.overview_polyline.points;
    
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x300&path=enc:${encodedPolyline}&key=${GOOGLE_MAPS_API_KEY}`;

    // レスポンスデータを整形
    const routeInfo = {
      distance: route.legs.reduce((total, leg) => total + leg.distance.value, 0),
      duration: route.legs.reduce((total, leg) => total + leg.duration.value, 0),
      legs: route.legs.map(leg => ({
        start_address: leg.start_address,
        end_address: leg.end_address,
        distance: leg.distance,
        duration: leg.duration,
        steps: leg.steps.map(step => ({
          html_instructions: step.html_instructions,
          distance: step.distance,
          duration: step.duration
        }))
      }))
    };
    
    // 距離と時間の制限チェック
    const exceedsDistance = routeInfo.distance > MAX_DISTANCE_METERS;
    const exceedsDuration = routeInfo.duration > MAX_DURATION_SECONDS;
    
    if (exceedsDistance || exceedsDuration) {
      console.warn(`ルートが制限を超過: 距離=${(routeInfo.distance/1000).toFixed(1)}km (上限${MAX_DISTANCE_METERS/1000}km), 時間=${Math.round(routeInfo.duration/60)}分 (上限${MAX_DURATION_SECONDS/60}分)`);
      
      // 問題のある区間を特定
      const problematicLegs = route.legs.filter(leg => 
        leg.distance.value > MAX_DISTANCE_METERS * 0.6 || 
        leg.duration.value > MAX_DURATION_SECONDS * 0.6
      );
      
      // 代替案を提案
      const alternatives = [];
      for (const leg of problematicLegs) {
        const startLocation = leg.start_address.split(',')[0]; // 住所の最初の部分を取得
        const endLocation = leg.end_address.split(',')[0];
        
        const startAlternatives = await findNearbyAlternatives(startLocation);
        const endAlternatives = await findNearbyAlternatives(endLocation);
        
        alternatives.push({
          problematic_leg: {
            from: leg.start_address,
            to: leg.end_address,
            distance: leg.distance,
            duration: leg.duration
          },
          suggested_start_alternatives: startAlternatives,
          suggested_end_alternatives: endAlternatives
        });
      }
      
      return NextResponse.json({
        static_map_url: staticMapUrl,
        route: routeInfo,
        waypoints: waypoints,
        warning: {
          exceeds_limits: true,
          distance_exceeded: exceedsDistance,
          duration_exceeded: exceedsDuration,
          max_distance_km: MAX_DISTANCE_METERS / 1000,
          max_duration_minutes: MAX_DURATION_SECONDS / 60,
          current_distance_km: Math.round(routeInfo.distance / 1000 * 10) / 10,
          current_duration_minutes: Math.round(routeInfo.duration / 60),
          alternatives: alternatives,
          recommendation: "長距離移動が検出されました。近くの類似スポットを検討してください。"
        }
      });
    }

    return NextResponse.json({
      static_map_url: staticMapUrl,
      route: routeInfo,
      waypoints: waypoints
    });

  } catch (error) {
    console.error('Directions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
