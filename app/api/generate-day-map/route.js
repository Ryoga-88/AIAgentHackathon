import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { waypoints, polylines, day } = await request.json();

    if (!waypoints || waypoints.length === 0) {
      return NextResponse.json({ error: 'ウェイポイントが必要です' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Maps APIキーが設定されていません' }, { status: 500 });
    }

    // 静的マップのURLを生成
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      key: apiKey,
      size: '600x400',
      maptype: 'roadmap',
      format: 'png'
    });

    // ウェイポイントをマーカーとして追加
    waypoints.forEach((waypoint, index) => {
      const markerColor = index === 0 ? 'green' : index === waypoints.length - 1 ? 'red' : 'blue';
      const label = index + 1;
      params.append('markers', `color:${markerColor}|label:${label}|${encodeURIComponent(waypoint)}`);
    });

    // ポリラインがある場合は追加
    if (polylines && polylines.length > 0) {
      polylines.forEach(polyline => {
        params.append('path', `color:0x0000ff|weight:3|enc:${polyline}`);
      });
    }

    const staticMapUrl = `${baseUrl}?${params.toString()}`;

    return NextResponse.json({
      static_map_url: staticMapUrl,
      day: day,
      waypoints_count: waypoints.length,
      polylines_count: polylines?.length || 0
    });

  } catch (error) {
    console.error('日別マップ生成エラー:', error);
    return NextResponse.json(
      { error: 'マップ生成に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}