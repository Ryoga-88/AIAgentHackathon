export async function POST(request) {
  const body = await request.json();
  const { placeName } = body;

  try {
    const apiKey = "AIzaSyCB_NyYDaauWJHRGBsX4vn9fQvq6_Hxvzo";

    // Places Text Search APIで場所を検索
    const textSearchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placeName)}&key=${apiKey}&language=ja&region=jp`
    );

    const textSearchData = await textSearchResponse.json();

    if (textSearchData.status !== "OK" || !textSearchData.results.length) {
      return Response.json(
        { 
          message: "場所が見つかりませんでした",
          place_name: placeName
        },
        { status: 404 }
      );
    }

    const place = textSearchData.results[0];
    let photoUrl = null;
    let placeDetails = {
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      rating: place.rating,
      types: place.types,
      geometry: place.geometry
    };

    // 写真が利用可能な場合、写真URLを取得
    if (place.photos && place.photos.length > 0) {
      const photoReference = place.photos[0].photo_reference;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${apiKey}`;
    }

    // Place Details APIで詳細情報を取得
    try {
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,photos,rating,reviews,types,website,formatted_phone_number&key=${apiKey}&language=ja`
      );

      const detailsData = await detailsResponse.json();

      if (detailsData.status === "OK" && detailsData.result) {
        placeDetails = {
          ...placeDetails,
          ...detailsData.result,
          reviews: detailsData.result.reviews?.slice(0, 3) // 最大3件のレビュー
        };

        // より高解像度の写真があれば取得
        if (detailsData.result.photos && detailsData.result.photos.length > 0) {
          const bestPhoto = detailsData.result.photos[0];
          photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${bestPhoto.photo_reference}&key=${apiKey}`;
        }
      }
    } catch (detailsError) {
      console.warn("Place Details取得エラー:", detailsError);
      // Details取得に失敗してもText Searchの結果は返す
    }

    return Response.json({
      place_name: placeName,
      place_details: placeDetails,
      photo_url: photoUrl,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      }
    });

  } catch (error) {
    console.error("Places API エラー:", error);
    return Response.json(
      {
        message: "場所情報の取得中にエラーが発生しました",
        error: error.message,
        place_name: placeName
      },
      { status: 500 }
    );
  }
}