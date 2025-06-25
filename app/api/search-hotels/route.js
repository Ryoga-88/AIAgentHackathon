import { NextResponse } from "next/server";

const RAKUTEN_APP_ID = process.env.RAKUTEN_APPLICATION_ID;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * キャッシュから地名に一致するエリアコードを検索する関数
 * @param {string} locationName - 検索したい地名
 * @returns {{type: string, code: string}|null} - 見つかったエリアコードの種類とコード
 */
function findAreaCodeFromCache(locationName) {
  if (!areaDataCache?.areaClasses?.largeClasses) {
    console.error("Area data cache is not properly loaded.");
    return null;
  }

  // 日本のエリア情報を取得（通常は japan のlargeClassCode）
  const japanArea = areaDataCache.areaClasses.largeClasses.find(
    (lc) => lc.largeClass[0].largeClassCode === "japan"
  );

  if (!japanArea?.largeClass[0]?.middleClasses) {
    console.error("Japan area or middleClasses not found in cached data.");
    return null;
  }

  const middleClasses = japanArea.largeClass[0].middleClasses;

  // 地名の正規化（カタカナをひらがなに変換、漢字の異体字対応など）
  const normalizedLocation = locationName.toLowerCase();

  for (const mc of middleClasses) {
    const middleClassInfo = mc.middleClass[0];

    // 都道府県名の処理（「〇〇県」「〇〇府」「〇〇都」「〇〇道」の末尾を削除）
    const prefName = middleClassInfo.middleClassName.replace(/[県府都道]$/, "");

    if (
      normalizedLocation.includes(prefName.toLowerCase()) ||
      normalizedLocation.includes(middleClassInfo.middleClassName.toLowerCase())
    ) {
      // より詳細な小エリア(市区町村)を検索
      if (
        middleClassInfo.smallClasses &&
        middleClassInfo.smallClasses.length > 0
      ) {
        for (const sc of middleClassInfo.smallClasses) {
          const smallClassInfo = sc.smallClass[0];

          // 小エリア名の処理（「渋谷・恵比寿」のような複数地名対応）
          const smallAreaNames = smallClassInfo.smallClassName.split(/[・、]/);

          for (const areaName of smallAreaNames) {
            const cleanAreaName = areaName.trim();
            if (
              normalizedLocation.includes(cleanAreaName.toLowerCase()) &&
              cleanAreaName.length > 1
            ) {
              console.log(
                `Found smallClassCode: ${smallClassInfo.smallClassCode} for ${cleanAreaName}`
              );
              return {
                type: "smallClassCode",
                code: smallClassInfo.smallClassCode,
              };
            }
          }
        }
      }

      // 小エリアが見つからない場合は中エリア(都道府県)のコードを返す
      console.log(
        `Found middleClassCode: ${middleClassInfo.middleClassCode} for ${prefName}`
      );
      return {
        type: "middleClassCode",
        code: middleClassInfo.middleClassCode,
      };
    }
  }

  console.log(`No area code found for location: ${locationName}`);
  return null;
}

// レート制限対応を強化（楽天APIの制限に準拠）
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2秒に延長
let requestCount = 0;
let requestTimeWindow = Date.now();
const MAX_REQUESTS_PER_MINUTE = 30; // 1分あたり30回に制限

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

  // 基本的な間隔制御
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`レート制限のため${waitTime}ms待機中...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  requestCount++;
  lastRequestTime = Date.now();
}

function normalizeHotelKeyword(keyword) {
  const cleanKeyword = keyword
    .replace(/宿泊なし.*?|なし.*?最終日.*?|.*帰宅予定.*?/g, "")
    .replace(/市内の?|地域の?|周辺の?|地元の?|近くの?/g, "")
    .replace(/リーズナブルな|格安の?|高級な?|安い|高い/g, "")
    .replace(/ビジネスホテル|ゲストハウス.*?、?|民宿|旅館/g, "")
    .replace(/宿泊施設|ホテル|宿/g, "")
    .replace(/\（.*?\）|\(.*?\)/g, "") // 括弧内の情報を削除
    .replace(/相場.*?円.*?泊/g, "") // 相場情報を削除
    .replace(/チェックアウト|チェックイン/g, "") // チェックイン/アウト関連を削除
    .replace(/エリア|地区/g, "") // エリア、地区を削除
    .trim();

  // 空文字や短すぎるキーワードをチェック
  if (!cleanKeyword || cleanKeyword.length < 2) {
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

      // エリアコードの検索
      const areaInfo = findAreaCodeFromCache(searchKeyword);

      if (areaInfo) {
        // エリアコードが見つかった場合はエリアコードのみで検索
        searchParams.append(areaInfo.type, areaInfo.code);
        console.log(
          `Using ${areaInfo.type}: ${areaInfo.code} (without keyword)`
        );

        // エリアコードがある場合はキーワードを追加しない（APIの制限により）
        // 代わりにより具体的なキーワードのみ追加する場合がある
        if (searchKeyword.length > 3 && !searchKeyword.includes("エリア")) {
          searchParams.append("keyword", searchKeyword);
        }
      } else {
        // エリアコードが見つからない場合はキーワードのみで検索
        // largeClassCodeは指定せず、keywordのみで全国検索
        searchParams.append("keyword", searchKeyword);
        console.log(
          `Using keyword only: ${searchKeyword} (no area code found)`
        );
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
        // レート制限エラーの場合、追加待機
        console.log("レート制限エラー。追加で5秒待機します...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        throw new Error("Rate limit exceeded.");
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
      statusCode = 429;
      errorMessage =
        "リクエストが頻繁すぎます。しばらく時間をおいてお試しください。";
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
