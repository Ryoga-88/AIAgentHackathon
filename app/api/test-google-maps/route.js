import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }

    // 簡単なGeocodingテスト
    const testLocation = "東京駅";
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testLocation)}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      status: data.status,
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set',
      testLocation: testLocation,
      results: data.results?.length || 0,
      quota: response.headers.get('x-android-sent-millis') || 'Unknown'
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
