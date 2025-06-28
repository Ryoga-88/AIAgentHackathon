import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { waypoints } = body;
    console.log('Directions API リクエスト受信:', { body, waypoints });

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      console.error('不正なwaypoints:', waypoints, 'received body:', body);
      return NextResponse.json(
        { error: 'At least 2 waypoints are required', received_waypoints: waypoints, received_body: body },
        { status: 400 }
      );
    }

    // 空文字列やnull値をフィルタリング
    const validWaypoints = waypoints.filter(wp => wp && typeof wp === 'string' && wp.trim() !== '');
    
    if (validWaypoints.length < 2) {
      console.error('有効なwaypoints不足:', validWaypoints, 'original:', waypoints);
      return NextResponse.json(
        { error: 'At least 2 valid waypoints are required', valid_waypoints: validWaypoints, original_waypoints: waypoints },
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

    // Google Directions APIを呼び出し（有効なwaypointsを使用）
    const origin = encodeURIComponent(validWaypoints[0]);
    const destination = encodeURIComponent(validWaypoints[validWaypoints.length - 1]);
    const waypointsParam = validWaypoints.slice(1, -1).length > 0 
      ? `&waypoints=${validWaypoints.slice(1, -1).map(w => encodeURIComponent(w)).join('|')}`
      : '';

    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointsParam}&key=${GOOGLE_MAPS_API_KEY}`;

    const directionsResponse = await fetch(directionsUrl);
    const directionsData = await directionsResponse.json();

    if (directionsData.status !== 'OK') {
      console.error('Directions API エラー:', directionsData.status, directionsData.error_message, 'valid waypoints:', validWaypoints);
      return NextResponse.json(
        { error: 'Failed to get directions', details: directionsData.error_message, status: directionsData.status, waypoints: validWaypoints },
        { status: 400 }
      );
    }

    console.log('Directions API 成功:', validWaypoints);

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

    return NextResponse.json({
      static_map_url: staticMapUrl,
      route: routeInfo,
      waypoints: validWaypoints
    });

  } catch (error) {
    console.error('Directions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
