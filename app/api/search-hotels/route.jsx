export async function POST(request) {
  const body = await request.json();
  const { checkin, checkout, adults, searchType, coordinates, areaCodes } = body;

  try {
    const applicationId = "1037506766385892412"; // 楽天アプリID
    let params;
    let url;

    if (searchType === "coordinates" && coordinates) {
      // 座標での検索
      params = new URLSearchParams({
        applicationId,
        format: "json",
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        searchRadius: "3", // 3km以内
        datumType: "1",
        checkinDate: checkin,
        checkoutDate: checkout,
        adultNum: adults,
        hits: 10, // より多くのホテルを取得してソート
        sort: "reviewAverage" // 評価順でソート
      });
      url = `https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426?${params.toString()}`;
    } else if (areaCodes) {
      // エリアコードでの検索
      params = new URLSearchParams({
        applicationId,
        format: "json",
        largeClassCode: areaCodes.largeClassCode || "japan",
        middleClassCode: areaCodes.middleClassCode || "kyoto",
        smallClassCode: areaCodes.smallClassCode || "shi",
        detailClassCode: areaCodes.detailClassCode || "A",
        checkinDate: checkin,
        checkoutDate: checkout,
        adultNum: adults,
        hits: 10, // より多くのホテルを取得してソート
        sort: "reviewAverage" // 評価順でソート
      });
      url = `https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426?${params.toString()}`;
    } else {
      // デフォルトは京都での検索
      params = new URLSearchParams({
        applicationId,
        format: "json",
        largeClassCode: "japan",
        middleClassCode: "kyoto",
        smallClassCode: "shi",
        detailClassCode: "A",
        checkinDate: checkin,
        checkoutDate: checkout,
        adultNum: adults,
        hits: 10, // より多くのホテルを取得してソート
        sort: "reviewAverage" // 評価順でソート
      });
      url = `https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: "GET",
    });

    const data = await response.json();

    if (!data.hotels || !Array.isArray(data.hotels)) {
      return Response.json(
        {
          message: "ホテル情報が取得できませんでした",
          raw: data,
        },
        { status: 500 }
      );
    }

    // レスポンス整形（評価順でソートしてトップ3を取得）
    const sortedHotels = data.hotels
      .sort((a, b) => {
        const ratingA = a.hotel[0].hotelBasicInfo.reviewAverage || 0;
        const ratingB = b.hotel[0].hotelBasicInfo.reviewAverage || 0;
        return ratingB - ratingA; // 降順ソート
      })
      .slice(0, 3);

    const formattedResults = sortedHotels.map((item) => {
      const hotel = item.hotel[0].hotelBasicInfo;
      return {
        id: hotel.hotelNo,
        name: hotel.hotelName,
        location: (hotel.address1 || "") + (hotel.address2 || ""),
        price: hotel.hotelMinCharge
          ? `¥${hotel.hotelMinCharge.toLocaleString()}/泊`
          : "料金未定",
        rating: hotel.reviewAverage || 0,
        reviewCount: hotel.reviewCount || 0,
        url: hotel.hotelInformationUrl,
        image: hotel.hotelImageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
        coordinates: {
          lat: hotel.latitude,
          lng: hotel.longitude
        },
        description: hotel.hotelSpecial || "快適なホテルをご提供いたします。"
      };
    });

    return Response.json({
      results: formattedResults,
      searchParams: { checkin, checkout, adults, searchType },
    });
  } catch (error) {
    console.error("検索エラー:", error);
    return Response.json(
      {
        message: "検索中にエラーが発生しました",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// const mockResults = [
//     {
//       name: "ホテル・ローマ・パレス",
//       location: "ローマ中心部",
//       price: "¥15,800/泊",
//       rating: 8.5,
//       url: "https://example.com/hotel1",
//     },
//     {
//       name: "フィレンツェ・ブティックホテル",
//       location: "フィレンツェ歴史地区",
//       price: "¥12,400/泊",
//       rating: 9.2,
//       url: "https://example.com/hotel2",
//     },
//     {
//       name: "ベネチア・カナルビューホテル",
//       location: "ベネチア本島",
//       price: "¥22,300/泊",
//       rating: 8.8,
//       url: "https://example.com/hotel3",
//     },
//     {
//       name: "ミラノ・ビジネスホテル",
//       location: "ミラノ中央駅近く",
//       price: "¥9,800/泊",
//       rating: 7.9,
//       url: "https://example.com/hotel4",
//     },
//     {
//       name: "トスカーナ・リゾート",
//       location: "シエナ郊外",
//       price: "¥18,600/泊",
//       rating: 9.1,
//       url: "https://example.com/hotel5",
//     },
//   ];
