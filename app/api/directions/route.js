import { NextResponse } from 'next/server';

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
