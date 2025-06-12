const readline = require("readline");
const https = require("https");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question, defaultValue) {
  return new Promise((resolve) =>
    rl.question(
      `${question}${defaultValue ? ` [${defaultValue}]` : ""}: `,
      (ans) => resolve(ans || defaultValue)
    )
  );
}

(async () => {
  const searchType = await ask(
    "検索方法を選択してください (1:エリアコード/市区町村名, 2:緯度経度)",
    "1"
  );
  const checkin = await ask("チェックイン日 (例: 2025-06-11)", "2025-06-11");
  const checkout = await ask("チェックアウト日 (例: 2025-06-13)", "2025-06-13");
  const adults = await ask("大人人数 (例: 2)", "2");

  let params;
  let url;

  if (searchType === "2") {
    // 緯度経度で検索 - SimpleHotelSearch APIを使用
    const latitude = await ask("緯度 (例: 35.6895)");
    const longitude = await ask("経度 (例: 139.6917)");
    const searchRadius = await ask("検索半径(km, 例: 2)", "2");

    params = new URLSearchParams({
      applicationId: "1037506766385892412",
      format: "json",
      latitude,
      longitude,
      searchRadius,
      datumType: "1",
      checkinDate: checkin,
      checkoutDate: checkout,
      adultNum: adults,
      hits: 10,
    });

    // SimpleHotelSearch APIのエンドポイント
    url = `https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426?${params.toString()}`;
  } else {
    // エリアコード/市区町村名で検索 - SimpleHotelSearch APIを使用
    const largeClassCode = await ask("largeClassCode (例: japan)", "japan");
    const middleClassCode = await ask("middleClassCode (例: kyoto)", "kyoto");
    const smallClassCode = await ask("smallClassCode (例: shi)", "shi");
    const detailClassCode = await ask("detailClassCode (例: A)", "A");

    params = new URLSearchParams({
      applicationId: "1037506766385892412",
      format: "json",
      largeClassCode,
      middleClassCode,
      smallClassCode,
      detailClassCode,
      checkinDate: checkin,
      checkoutDate: checkout,
      adultNum: adults,
      hits: 10,
    });

    url = `https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426?${params.toString()}`;
  }

  console.log(`\n=== API URL ===\n${url}\n`);

  https
    .get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);

          // エラーチェック
          if (json.error) {
            console.error("APIエラー:", json.error_description || json.error);
            rl.close();
            return;
          }

          // VacantHotelSearch と SimpleHotelSearch でレスポンス構造が異なる
          let hotels;
          if (searchType === "2") {
            // VacantHotelSearch の場合
            hotels = json.hotels;
          } else {
            // SimpleHotelSearch の場合
            hotels = json.hotels;
          }

          if (!hotels || !Array.isArray(hotels) || hotels.length === 0) {
            console.log("指定した条件でホテルが見つかりませんでした。");
            console.log("条件を変更して再度お試しください。");
            rl.close();
            return;
          }

          console.log(`\n=== 検索結果 (${hotels.length}件) ===`);

          hotels.forEach((item, index) => {
            let hotel;
            if (searchType === "2") {
              // VacantHotelSearch の場合のデータ構造
              hotel = item.hotel
                ? item.hotel[0].hotelBasicInfo
                : item.hotelBasicInfo;
            } else {
              // SimpleHotelSearch の場合のデータ構造
              hotel = item.hotel[0].hotelBasicInfo;
            }

            console.log(
              `\n--- ${index + 1}. ${hotel.hotelName || "ホテル名不明"} ---`
            );
            console.log(`住所: ${hotel.address1 || ""}${hotel.address2 || ""}`);

            // 料金情報の表示
            if (hotel.hotelMinCharge) {
              console.log(
                `最低料金: ¥${hotel.hotelMinCharge.toLocaleString()}/泊`
              );
            }

            // 評価の表示
            if (hotel.reviewAverage) {
              console.log(
                `評価: ${hotel.reviewAverage} (${hotel.reviewCount || 0}件)`
              );
            }

            // URL
            if (hotel.hotelInformationUrl) {
              console.log(`詳細: ${hotel.hotelInformationUrl}`);
            }

            // 緯度経度検索の場合は距離も表示
            if (searchType === "2" && hotel.latitude && hotel.longitude) {
              console.log(`座標: ${hotel.latitude}, ${hotel.longitude}`);
            }
          });
        } catch (e) {
          console.error("JSONパースエラー:", e.message);
          console.log("APIレスポンス:", data.substring(0, 500) + "...");
        }
        rl.close();
      });
    })
    .on("error", (e) => {
      console.error("リクエストエラー:", e.message);
      rl.close();
    });
})();
