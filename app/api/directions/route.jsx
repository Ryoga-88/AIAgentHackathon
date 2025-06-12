export async function POST(request) {
  const body = await request.json();
  const { waypoints } = body;

  try {
    const apiKey = "AIzaSyCB_NyYDaauWJHRGBsX4vn9fQvq6_Hxvzo";

    if (!waypoints || waypoints.length < 2) {
      return Response.json(
        { message: "最低2つの地点が必要です" },
        { status: 400 }
      );
    }

    // 起点と終点を設定
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    
    // 中間地点を設定（起点と終点以外）
    const intermediateWaypoints = waypoints.slice(1, -1);
    
    // Directions APIのパラメータを構築
    const params = new URLSearchParams({
      origin: encodeURIComponent(origin),
      destination: encodeURIComponent(destination),
      key: apiKey,
      mode: 'driving',
      language: 'ja',
      region: 'jp'
    });

    // 中間地点がある場合は追加
    if (intermediateWaypoints.length > 0) {
      params.append('waypoints', intermediateWaypoints.map(wp => encodeURIComponent(wp)).join('|'));
    }

    const directionsResponse = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );

    const directionsData = await directionsResponse.json();

    if (directionsData.status !== "OK") {
      return Response.json(
        { 
          message: "経路が見つかりませんでした",
          status: directionsData.status,
          error_message: directionsData.error_message
        },
        { status: 500 }
      );
    }

    const route = directionsData.routes[0];
    const leg = route.legs[0];

    // Static Map URLを生成（経路付き）
    const staticMapParams = new URLSearchParams({
      size: '800x400',
      maptype: 'roadmap',
      key: apiKey,
      language: 'ja',
      region: 'jp'
    });

    // 経路のポリラインを追加
    if (route.overview_polyline && route.overview_polyline.points) {
      staticMapParams.append('path', `enc:${route.overview_polyline.points}`);
    }

    // マーカーを追加
    waypoints.forEach((waypoint, index) => {
      const label = String.fromCharCode(65 + index); // A, B, C...
      staticMapParams.append('markers', `color:red|label:${label}|${encodeURIComponent(waypoint)}`);
    });

    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?${staticMapParams.toString()}`;

    return Response.json({
      route: {
        distance: leg.distance?.text || "不明",
        duration: leg.duration?.text || "不明", 
        start_address: leg.start_address,
        end_address: leg.end_address,
        steps: leg.steps?.map(step => ({
          instruction: step.html_instructions?.replace(/<[^>]*>/g, ''), // HTMLタグを除去
          distance: step.distance?.text,
          duration: step.duration?.text,
          start_location: step.start_location,
          end_location: step.end_location
        })) || []
      },
      static_map_url: staticMapUrl,
      waypoints: waypoints,
      overview_polyline: route.overview_polyline?.points
    });

  } catch (error) {
    console.error("Directions API エラー:", error);
    return Response.json(
      {
        message: "経路検索中にエラーが発生しました",
        error: error.message,
      },
      { status: 500 }
    );
  }
}