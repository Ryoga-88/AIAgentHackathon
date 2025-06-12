export async function POST(request) {
  const body = await request.json();
  const { checkin, checkout, adults } = body;

  try {
    const applicationId = "1037506766385892412"; // 楽天アプリID

    const params = new URLSearchParams({
      applicationId,
      format: "json",
      largeClassCode: "japan",
      middleClassCode: "kyoto",
      smallClassCode: "shi",
      detailClassCode: "A",
      checkinDate: checkin, // yyyy-mm-dd
      checkoutDate: checkout, // yyyy-mm-dd
      adultNum: adults,
      hits: 10,
    });

    const response = await fetch(
      `https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426?${params.toString()}`,
      {
        method: "GET",
      }
    );

    const data = await response.json();
    console.log("楽天APIレスポンス:", data);

    if (!data.hotels || !Array.isArray(data.hotels)) {
      return Response.json(
        {
          message: "ホテル情報が取得できませんでした",
          raw: data,
        },
        { status: 500 }
      );
    }

    // レスポンス整形
    const formattedResults = data.hotels.map((item) => {
      const hotel = item.hotel[0].hotelBasicInfo;
      return {
        name: hotel.hotelName,
        location: hotel.address1 + hotel.address2,
        price: hotel.hotelMinCharge
          ? `¥${hotel.hotelMinCharge.toLocaleString()}/泊`
          : "-",
        rating: hotel.reviewAverage || "-",
        url: hotel.hotelInformationUrl,
      };
    });

    return Response.json({
      results: formattedResults,
      searchParams: { checkin, checkout, adults },
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
