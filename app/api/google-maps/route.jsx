export async function POST(request) {
  const body = await request.json();
  const { location } = body;

  try {
    const apiKey = "AIzaSyCB_NyYDaauWJHRGBsX4vn9fQvq6_Hxvzo";

    // Step 1: Geocoding APIで位置情報を取得
    const geocodingResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
    );
    const geocodingData = await geocodingResponse.json();

    if (geocodingData.status !== "OK" || !geocodingData.results.length) {
      return Response.json(
        { message: "位置情報が見つかりませんでした" },
        { status: 404 }
      );
    }

    const result = geocodingData.results[0];
    const coordinates = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng
    };

    // Step 2: Places APIで詳細情報を取得
    const placesResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(location)}&inputtype=textquery&fields=place_id,name,formatted_address,photos&key=${apiKey}`
    );
    const placesData = await placesResponse.json();

    let photoUrl = null;
    let placeDetails = null;

    if (placesData.status === "OK" && placesData.candidates.length > 0) {
      const place = placesData.candidates[0];
      placeDetails = {
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address
      };

      // 写真が利用可能な場合、写真URLを取得
      if (place.photos && place.photos.length > 0) {
        const photoReference = place.photos[0].photo_reference;
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${apiKey}`;
      }
    }

    // Step 3: Static Maps APIでマップ画像を取得
    const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=15&size=800x400&maptype=roadmap&markers=color:red%7C${coordinates.lat},${coordinates.lng}&key=${apiKey}`;

    return Response.json({
      location: location,
      coordinates: coordinates,
      place_details: placeDetails,
      photo_url: photoUrl,
      map_image_url: mapImageUrl,
      formatted_address: result.formatted_address
    });

  } catch (error) {
    console.error("Google Maps API エラー:", error);
    return Response.json(
      {
        message: "位置情報の取得中にエラーが発生しました",
        error: error.message,
      },
      { status: 500 }
    );
  }
}