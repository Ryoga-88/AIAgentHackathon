import { NextResponse } from "next/server";

const RAKUTEN_APP_ID = process.env.RAKUTEN_APPLICATION_ID;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// 旅行の豆知識データ
const TRAVEL_TIPS = [
  {
    title: "日本の温泉マナー",
    content: "温泉に入る前は必ずかけ湯をして体を清めましょう。タオルは湯船に入れず、頭の上に載せるか洗い場に置きます。",
    emoji: "♨️"
  },
  {
    title: "神社参拝の作法",
    content: "鳥居をくぐる時は一礼し、参道の中央は神様の通り道なので端を歩きます。手水舎で手と口を清めてから参拝しましょう。",
    emoji: "⛩️"
  },
  {
    title: "お箸のマナー",
    content: "お箸を使って食べる時は、迷い箸（どれを食べようか迷って箸を動かす）や刺し箸は避けましょう。",
    emoji: "🥢"
  },
  {
    title: "電車での過ごし方",
    content: "日本の電車内では通話は控えめに。優先席付近では携帯電話の電源を切るか、マナーモードにしましょう。",
    emoji: "🚃"
  },
  {
    title: "チップ文化について",
    content: "日本にはチップの習慣がありません。優れたサービスに対しては「ありがとうございます」の言葉で感謝を表現します。",
    emoji: "💴"
  },
  {
    title: "おもてなしの心",
    content: "日本の「おもてなし」は相手を思いやる心。観光地では地元の方々の温かいもてなしを感じることができます。",
    emoji: "🎌"
  },
  {
    title: "季節の楽しみ方",
    content: "日本は四季が美しい国。春は桜、夏は祭り、秋は紅葉、冬は雪景色。それぞれの季節に特別な魅力があります。",
    emoji: "🌸"
  },
  {
    title: "地域の特産品",
    content: "各地域には独特の特産品があります。その土地でしか味わえない郷土料理や工芸品を探してみましょう。",
    emoji: "🍱"
  },
  {
    title: "お祭りの魅力",
    content: "日本各地で行われる祭りは、その地域の歴史と文化が詰まった貴重な体験。地元の人と一緒に楽しみましょう。",
    emoji: "🎊"
  },
  {
    title: "自然との調和",
    content: "日本庭園や寺院では、自然と建築が調和した美しさを感じられます。静寂の中で心を落ち着けてみてください。",
    emoji: "🏯"
  }
];

// ランダムな旅行の豆知識を取得
function getRandomTravelTip() {
  const randomIndex = Math.floor(Math.random() * TRAVEL_TIPS.length);
  return TRAVEL_TIPS[randomIndex];
}

// 楽天API厳格なレート制限対応（1秒に1回以下を厳守）
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1秒に延長（安全マージン追加）
let requestCount = 0;
let requestTimeWindow = Date.now();
const MAX_REQUESTS_PER_MINUTE = 50; // 楽天の制限（60回/分）を少し下回る設定

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  // 1分間のウィンドウをリセット
  if (now - requestTimeWindow > 60000) {
    requestCount = 0;
    requestTimeWindow = now;
  }

  // 1分間のリクエスト数制限
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = 60000 - (now - requestTimeWindow);
    console.log(
      `1分間のリクエスト上限に達しました。${waitTime}ms待機します...`
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    requestCount = 0;
    requestTimeWindow = Date.now();
  }

  // 楽天API厳格な制限: 前回から1.1秒経過していなければ待機
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`楽天API制限のため${waitTime}ms待機中... (1秒に1回制限)`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  requestCount++;
  lastRequestTime = Date.now();
  console.log(`楽天API呼び出し実行: ${new Date().toISOString()}`);
}

function normalizeHotelKeyword(keyword) {
  const cleanKeyword = keyword
    .replace(/宿泊なし.*?|なし.*?最終日.*?|.*帰宅予定.*?/g, "")
    .replace(/市内の?|地域の?|周辺の?|地元の?|近くの?|内の?/g, "")
    .replace(/リーズナブルな|格安の?|高級な?|安い|高い/g, "")
    .replace(/ビジネスホテル|ゲストハウス.*?、?|民宿|旅館/g, "")
    .replace(/宿泊施設|ホテル|宿/g, "")
    .replace(/\（.*?\）|\(.*?\)/g, "") // 括弧内の情報を削除
    .replace(/相場.*?円.*?泊/g, "") // 相場情報を削除
    .replace(/チェックアウト|チェックイン/g, "") // チェックイン/アウト関連を削除
    .replace(/エリア|地区/g, "") // エリア、地区を削除
    .trim();

  // 空文字や短すぎるキーワード、無効なキーワードをチェック
  if (!cleanKeyword || cleanKeyword.length < 2 || 
      cleanKeyword === 'なし' || cleanKeyword === 'の' || 
      cleanKeyword.match(/^(の|内|周辺|近く)$/)) {
    return null;
  }

  // 特定のホテル名やチェーン名はそのまま返す
  const hotelChains = [
    "モントレ",
    "ニューオータニ",
    "リッツカールトン",
    "ハイアット",
  ];
  if (hotelChains.some((chain) => cleanKeyword.includes(chain))) {
    return cleanKeyword;
  }

  return cleanKeyword;
}

/**
 * 旅行プランから各日の最終地点の座標を取得する関数
 * @param {Array} itinerary - 旅行プランの日程配列
 * @returns {Promise<Array>} 各日の最終地点の座標配列
 */
async function getLastLocationCoordinates(itinerary) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API key is not configured");
    return [];
  }

  const coordinates = [];

  for (const day of itinerary) {
    if (!day.activities || day.activities.length === 0) continue;

    // 各日の最後のアクティビティを取得（宿泊が必要な日のみ）
    const lastActivity = day.activities[day.activities.length - 1];

    // search_queryが存在し、宿泊が必要な日（最終日でない）の場合のみ処理
    if (
      lastActivity.search_query &&
      day.accommodation &&
      day.accommodation !== "出発日のため宿泊なし"
    ) {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          lastActivity.search_query
        )}&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          coordinates.push({
            day: day.day,
            date: day.date,
            location: lastActivity.location,
            search_query: lastActivity.search_query,
            coordinates: {
              latitude: location.lat,
              longitude: location.lng,
            },
            accommodation_area: day.accommodation,
          });

          console.log(
            `Day ${day.day}: ${lastActivity.location} の座標を取得: ${location.lat}, ${location.lng}`
          );
        } else {
          console.warn(
            `Day ${day.day}: ${lastActivity.search_query} の座標取得に失敗`,
            data
          );
        }
      } catch (error) {
        console.error(`Day ${day.day}の座標取得エラー:`, error);
      }

      // APIレート制限対策
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return coordinates;
}

/**
 * 複数の座標でホテルを検索し、高評価順でソートして返す関数
 * @param {Array} coordinates - 座標配列
 * @param {Object} searchParams - 検索パラメータ
 * @returns {Promise<Array>} 統合・ソートされたホテルリスト
 */
async function searchHotelsForMultipleLocations(coordinates, searchParams) {
  const allHotels = [];
  const hotelIds = new Set(); // 重複チェック用

  for (const coord of coordinates) {
    try {
      // レート制限対策
      await waitForRateLimit();

      const searchUrl =
        "https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426";
      const params = new URLSearchParams({
        format: "json",
        applicationId: RAKUTEN_APP_ID,
        checkinDate: searchParams.checkin,
        checkoutDate: searchParams.checkout,
        adultNum: searchParams.adults.toString(),
        hits: "10", // より多くのホテルを取得
        latitude: coord.coordinates.latitude.toString(),
        longitude: coord.coordinates.longitude.toString(),
        searchRadius: "3", // 検索半径を少し広く
        datumType: "1", // WGS84座標系を指定
      });

      console.log(`Day ${coord.day} ホテル検索パラメータ:`, {
        checkinDate: searchParams.checkin,
        checkoutDate: searchParams.checkout,
        adultNum: searchParams.adults,
        latitude: coord.coordinates.latitude,
        longitude: coord.coordinates.longitude,
        searchRadius: "3",
      });

      const fullUrl = `${searchUrl}?${params.toString()}`;
      console.log(
        `座標検索 Day ${coord.day}: ${coord.location} (${coord.coordinates.latitude}, ${coord.coordinates.longitude})`
      );

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "User-Agent": "TravelSearchApp/1.0",
        },
      });

      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch (e) {
          errorDetails = await response.text();
        }
        console.error(
          `Day ${coord.day}のホテル検索で詳細エラー [${response.status}]:`,
          errorDetails
        );
        console.error(`リクエストURL: ${fullUrl}`);
        continue;
      }

      const data = await response.json();

      if (data.error) {
        console.error(
          `Day ${coord.day}のホテル検索でAPIエラー:`,
          data.error,
          data.error_description
        );
        continue;
      }

      // ホテルデータの処理
      const hotels = (data.hotels || [])
        .map((hotelData) => {
          const hotel = hotelData.hotel[0].hotelBasicInfo;
          return {
            id: hotel.hotelNo.toString(),
            name: hotel.hotelName,
            location: `${hotel.address1}${hotel.address2 || ""}`,
            price: hotel.hotelMinCharge
              ? `¥${hotel.hotelMinCharge.toLocaleString()}〜 /泊`
              : "料金要確認",
            rating: hotel.reviewAverage || 0,
            reviewCount: hotel.reviewCount || 0,
            image: hotel.hotelImageUrl,
            url: hotel.hotelInformationUrl,
            nearbyLocation: coord.location, // どの地点の近くのホテルか
            searchDay: coord.day,
            coordinates: {
              latitude: hotel.latitude || coord.coordinates.latitude,
              longitude: hotel.longitude || coord.coordinates.longitude,
            },
          };
        })
        .filter((hotel) => {
          // 重複除去（同じホテルIDは一度だけ）
          if (hotelIds.has(hotel.id)) {
            return false;
          }
          hotelIds.add(hotel.id);
          return true;
        });

      allHotels.push(...hotels);
      console.log(`Day ${coord.day}: ${hotels.length}件のホテルを追加`);
    } catch (error) {
      console.error(`Day ${coord.day}のホテル検索エラー:`, error);
    }
  }

  return allHotels;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      checkin,
      checkout,
      adults,
      searchType,
      coordinates,
      location,
      itinerary,
    } = body;

    // バリデーション
    if (!checkin || !checkout || !adults) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    if (!RAKUTEN_APP_ID) {
      return NextResponse.json(
        { error: "楽天アプリケーションIDが設定されていません" },
        { status: 500 }
      );
    }

    const searchUrl =
      "https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426";
    const searchParams = new URLSearchParams({
      format: "json",
      applicationId: RAKUTEN_APP_ID,
      checkinDate: checkin,
      checkoutDate: checkout,
      adultNum: adults.toString(),
      hits: "10",
    });

    if (
      searchType === "coordinates" &&
      coordinates?.latitude &&
      coordinates?.longitude
    ) {
      // 座標検索の場合
      searchParams.append("latitude", coordinates.latitude.toString());
      searchParams.append("longitude", coordinates.longitude.toString());
      searchParams.append("searchRadius", "3"); // 3km圏内
    } else if (searchType === "itinerary" && itinerary) {
      // 旅行プランの最終地点から座標を取得してホテル検索（複数地点対応）
      const lastLocationCoords = await getLastLocationCoordinates(itinerary);

      console.log("取得した座標データ:", lastLocationCoords);

      if (lastLocationCoords.length === 0) {
        return NextResponse.json({
          results: [],
          message: "旅行プランから有効な座標情報を取得できませんでした。",
        });
      }

      console.log(
        `旅行プラン検索: ${lastLocationCoords.length}ヶ所の地点でホテルを検索`
      );

      // 複数の座標で検索して統合
      const allHotels = await searchHotelsForMultipleLocations(
        lastLocationCoords,
        {
          checkin,
          checkout,
          adults,
        }
      );

      // reviewAverageが高いものを優先、最低限のホテルは必ず表示
      const highRatedHotels = allHotels
        .filter((hotel) => hotel.rating >= 3.8)
        .sort((a, b) => {
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return b.reviewCount - a.reviewCount;
        });

      let sortedHotels = highRatedHotels.slice(0, 20);

      // 高評価ホテルが3件未満の場合、条件を緩和して最低3件は表示
      if (sortedHotels.length < 3) {
        const additionalHotels = allHotels
          .filter(
            (hotel) =>
              hotel.rating >= 3.0 &&
              !sortedHotels.some((h) => h.id === hotel.id)
          )
          .sort((a, b) => {
            if (b.rating !== a.rating) {
              return b.rating - a.rating;
            }
            return b.reviewCount - a.reviewCount;
          })
          .slice(0, 3 - sortedHotels.length);

        sortedHotels = [...sortedHotels, ...additionalHotels];
      }

      // それでも足りない場合、評価に関係なく上位のホテルを表示
      if (sortedHotels.length < 2) {
        const fallbackHotels = allHotels
          .filter((hotel) => !sortedHotels.some((h) => h.id === hotel.id))
          .sort((a, b) => {
            if (b.rating !== a.rating) {
              return b.rating - a.rating;
            }
            return b.reviewCount - a.reviewCount;
          })
          .slice(0, 2 - sortedHotels.length);

        sortedHotels = [...sortedHotels, ...fallbackHotels];
      }

      const minRating =
        highRatedHotels.length > 0
          ? 3.8
          : sortedHotels.length > 0
          ? Math.min(...sortedHotels.map((h) => h.rating))
          : 0;

      return NextResponse.json({
        results: sortedHotels,
        searchParams: {
          checkin,
          checkout,
          adults,
          searchType,
          coordinates: lastLocationCoords,
        },
        searchInfo: {
          totalLocationsSearched: lastLocationCoords.length,
          totalHotelsFound: allHotels.length,
          highRatedHotelsReturned: sortedHotels.length,
          minRating: minRating,
        },
        message:
          sortedHotels.length > 0
            ? `${lastLocationCoords.length}ヶ所の地点からホテル${
                sortedHotels.length
              }件を見つけました${
                highRatedHotels.length > 0
                  ? `（うち高評価${highRatedHotels.length}件）`
                  : ""
              }`
            : "ホテルが見つかりませんでした。検索条件を変更してお試しください。",
      });
    } else if (searchType === "location" && location) {
      // 地名検索の場合
      const searchKeyword = normalizeHotelKeyword(location);
      if (!searchKeyword) {
        return NextResponse.json({
          results: [],
          message: "有効な検索キーワードが見つかりませんでした。",
        });
      }

      // Google Maps Geocoding APIを使用して地名から座標を取得
      if (!GOOGLE_MAPS_API_KEY) {
        return NextResponse.json(
          {
            error: "Google Maps API keyが設定されていません",
          },
          { status: 500 }
        );
      }

      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          searchKeyword
        )}&key=${GOOGLE_MAPS_API_KEY}&region=jp`;

        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (geocodeData.status === "OK" && geocodeData.results.length > 0) {
          const location = geocodeData.results[0].geometry.location;

          // 座標検索に切り替え
          searchParams.append("latitude", location.lat.toString());
          searchParams.append("longitude", location.lng.toString());
          searchParams.append("searchRadius", "3"); // 3km圏内
          searchParams.append("datumType", "1"); // WGS84座標系

          console.log(
            `Location search: ${searchKeyword} -> coordinates (${location.lat}, ${location.lng})`
          );
        } else {
          // 座標取得に失敗した場合、検索キーワードが有効かチェック
          const validKeyword = normalizeHotelKeyword(searchKeyword);
          if (validKeyword) {
            searchParams.append("largeClassCode", "japan");
            searchParams.append("keyword", validKeyword);
            console.log(
              `Fallback to area search: ${validKeyword} with japan area code`
            );
          } else {
            // 無効なキーワードの場合は旅行の豆知識を返す
            console.log(
              `Skipping invalid keyword: ${searchKeyword}, returning travel tip`
            );
            const travelTip = getRandomTravelTip();
            return NextResponse.json({
              hotels: [],
              travelTip: travelTip,
              message: "お探しの宿泊施設情報の代わりに、旅行の豆知識をお届けします！"
            });
          }
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        // エラーの場合も検索キーワードが有効かチェック
        const validKeyword = normalizeHotelKeyword(searchKeyword);
        if (validKeyword) {
          searchParams.append("largeClassCode", "japan");
          searchParams.append("keyword", validKeyword);
          console.log(
            `Error fallback to area search: ${validKeyword} with japan area code`
          );
        } else {
          // 無効なキーワードの場合は旅行の豆知識を返す
          console.log(
            `Skipping invalid keyword after geocoding error: ${searchKeyword}, returning travel tip`
          );
          const travelTip = getRandomTravelTip();
          return NextResponse.json({
            hotels: [],
            travelTip: travelTip,
            message: "旅行の豆知識をお届けします！"
          });
        }
      }
    } else {
      return NextResponse.json(
        {
          error:
            "検索タイプまたは検索パラメータが正しく指定されていません。searchType: coordinates, itinerary, location のいずれかを指定してください。",
        },
        { status: 400 }
      );
    }

    // レート制限待機
    await waitForRateLimit();

    const fullUrl = `${searchUrl}?${searchParams.toString()}`;
    console.log("楽天トラベルAPIリクエストURL:", fullUrl);

    // APIリクエスト実行
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "User-Agent": "TravelSearchApp/1.0",
      },
    });

    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = await response.json();
      } catch (e) {
        errorDetails = await response.text();
      }

      console.error(`楽天API詳細エラー [${response.status}]:`, errorDetails);

      if (response.status === 429) {
        // レート制限エラーの場合、旅行の豆知識を返してエラーを隠す
        console.log("レート制限エラー。旅行の豆知識を返します。");
        const travelTip = getRandomTravelTip();
        return NextResponse.json({
          hotels: [],
          travelTip: travelTip,
          message: "旅行の豆知識をお届けします！"
        });
      }

      if (response.status === 400) {
        throw new Error(
          `Invalid request parameters: ${JSON.stringify(errorDetails)}`
        );
      }

      throw new Error(`Rakuten API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `Rakuten API Error: ${data.error_description || data.error}`
      );
    }

    // レスポンスデータの処理（評価順でソート）
    const hotels = (data.hotels || [])
      .map((hotelData) => {
        const hotel = hotelData.hotel[0].hotelBasicInfo;
        return {
          id: hotel.hotelNo.toString(),
          name: hotel.hotelName,
          location: `${hotel.address1}${hotel.address2 || ""}`,
          price: hotel.hotelMinCharge
            ? `¥${hotel.hotelMinCharge.toLocaleString()}〜 /泊`
            : "料金要確認",
          rating: hotel.reviewAverage || 0,
          reviewCount: hotel.reviewCount || 0,
          image: hotel.hotelImageUrl,
          url: hotel.hotelInformationUrl,
        };
      })
      .sort((a, b) => b.rating - a.rating); // 評価の高い順でソート

    return NextResponse.json({
      results: hotels,
      searchParams: {
        checkin,
        checkout,
        adults,
        searchType,
        coordinates,
        location,
      },
      message:
        hotels.length > 0
          ? `${hotels.length}件のホテルが見つかりました`
          : "該当するホテルが見つかりませんでした。検索条件を変更してお試しください。",
    });
  } catch (apiError) {
    console.error("API通信でエラーが発生しました:", apiError.message);

    let statusCode = 500;
    let errorMessage =
      "ホテル検索サービスでエラーが発生しました。しばらく時間をおいてお試しください。";

    if (apiError.message.includes("Rate limit")) {
      // レート制限エラーの場合は旅行の豆知識を返す
      console.log("Catch: レート制限エラー。旅行の豆知識を返します。");
      const travelTip = getRandomTravelTip();
      return NextResponse.json({
        hotels: [],
        travelTip: travelTip,
        message: "旅行の豆知識をお届けします！"
      });
    } else if (apiError.message.includes("Invalid request")) {
      statusCode = 400;
      errorMessage =
        "検索パラメータが正しくありません。検索条件を確認してください。";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? apiError.message : undefined,
      },
      { status: statusCode }
    );
  }
}
