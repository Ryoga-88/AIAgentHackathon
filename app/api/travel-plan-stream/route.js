import { VertexAI } from "@google-cloud/vertexai";
import { NextResponse } from "next/server";

// Vertex AI クライアントの初期化
let vertexAI = null;
let model = null;
try {
  if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
    console.log(
      "Initializing Vertex AI with project:",
      process.env.GOOGLE_CLOUD_PROJECT_ID
    );
    vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: process.env.GOOGLE_CLOUD_LOCATION || "asia-northeast1",
    });
    model = vertexAI.getGenerativeModel({
      model: "gemini-1.5-pro",
    });
    console.log("Vertex AI initialized successfully");
  } else {
    console.log("GOOGLE_CLOUD_PROJECT_ID not found");
  }
} catch (error) {
  console.log("Vertex AI client initialization failed:", error.message);
}

// JSON出力スキーマ定義
const planSchema = {
  type: "object",
  properties: {
    plan_number: { type: "integer" },
    trip_id: { type: "string" },
    weather_type: { type: "string", enum: ["sunny", "rainy"] },
    theme: { type: "string" },
    theme_description: { type: "string" },
    hero: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        destination: { type: "string" },
        date: { type: "string" },
        budget: { type: "string" },
        highlights: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 3,
        },
      },
      required: [
        "title",
        "subtitle",
        "destination",
        "date",
        "budget",
        "highlights",
      ],
    },
    itinerary: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "integer" },
          date: { type: "string" },
          city: {
            type: "object",
            properties: {
              name: { type: "string" },
              name_en: { type: "string" },
              description: { type: "string" },
            },
            required: ["name", "name_en", "description"],
          },
          activities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                time: { type: "string" },
                title: { type: "string" },
                subtitle: { type: "string" },
                type: { type: "string" },
                priority: { type: "string" },
                description: { type: "string" },
                location: { type: "string" },
                search_query: { type: "string" },
                price: { type: "string" },
                rating: { type: "number" },
                tips: { type: "string" },
                activity_english: { type: "string" },
                image_search_term: { type: "string" },
                category: { type: "string" },
                is_free: { type: "boolean" },
              },
              required: [
                "id",
                "time",
                "title",
                "subtitle",
                "type",
                "priority",
                "description",
                "location",
                "search_query",
                "price",
                "rating",
                "tips",
                "activity_english",
                "image_search_term",
                "category",
                "is_free",
              ],
            },
          },
          accommodation: { type: "string" },
        },
        required: ["day", "date", "city", "activities", "accommodation"],
      },
    },
  },
  required: [
    "plan_number",
    "trip_id",
    "weather_type",
    "theme",
    "theme_description",
    "hero",
    "itinerary",
  ],
};

// デフォルトのプロンプトテンプレート
const defaultPromptTemplate = `
あなたは旅行プランの専門家です。以下の条件に基づいて、詳細な旅行プランを作成してください。

**基本条件:**
- 目的地: {{destination}}
- 日付: {{date}}
- 季節: {{season}}
- 季節の考慮事項: {{seasonal_considerations}}
- 予算: {{budget}}
- 人数: {{number_of_people}}
- 興味: {{interests}}
- その他の要望: {{additional_requests}}

**日程・予算について:**
- **旅行日数: {{duration}}日間** - この日数に合わせて必ずプランを作成してください
- 日程が指定されていない場合のみ、目的地に適した一般的な旅行期間（2〜3日程度）でプランを作成してください

**季節に応じた特別配慮:**
- 旅行時期（{{season}}）に最適な服装、持ち物、アクティビティを考慮してください
- 季節特有のイベント、見どころ、グルメを積極的に取り入れてください
- 天候や気温に配慮した現実的なスケジュールを組んでください

**参加者の個別要望:**
{{participants_preferences}}

**重要な制約事項:**
- **同じアクティビティや同じ場所への訪問は一度のみとし、旅行期間中に重複させないでください**
- 各日の活動場所やアクティビティは全て異なるものにしてください
- 同一施設や同一エリアでの複数回の訪問は避けてください

**宿泊に関する要件:**
- 旅行期間が1日の場合：日帰りのため宿泊情報は不要
- 旅行期間が2日以上の場合：宿泊数 = 旅行期間 - 1日
- 最終日以外の各日には、その夜泊まる宿泊地名を{accommodation}フィールドに出力してください
- 最終日は出発日のため{accommodation}は"出発日のため宿泊なし"または空文字列にしてください

**経路探索用の場所情報について:**
- 各アクティビティに "search_query" フィールドを必ず追加してください
- 具体的な観光地・施設がある場合：正確な場所名 + 地域名（例："清水寺 京都市", "函館山 北海道"）
- 抽象的な活動の場合：空文字列 ""
- 必ず実在する場所のみを記載し、不確実な場合は search_query を空文字列にしてください

**その他の要件:**
- 一般的な観光情報に基づいて、実用的なプランを作成してください
- 移動時間や交通手段も考慮した現実的なスケジュールにしてください
`;

// ストリーミング対応のPOSTエンドポイント
export async function POST(request) {
  try {
    // Vertex AI設定のチェック
    if (!vertexAI || !model) {
      console.log("Vertex AI not configured, returning mock data");
      return new Response(
        JSON.stringify({
          type: "complete",
          plans: [],
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();

    // リクエストからパラメータを取得
    const {
      destination,
      date,
      season,
      seasonal_considerations,
      budget,
      number_of_people,
      interests,
      additional_requests,
      customPrompt,
      participants,
      duration,
    } = body;

    // 必須パラメータの検証
    if (!destination) {
      return new Response(
        JSON.stringify({
          type: "error",
          message: "destination is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 推定処理時間の計算（日数 × 1分）
    const estimatedTimeMinutes = duration || 3;
    const estimatedTimeSeconds = estimatedTimeMinutes * 60;

    // ストリーミングレスポンスの設定
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 進捗を段階的に送信
          const sendProgress = (progress, message) => {
            const data = JSON.stringify({
              type: "progress",
              progress,
              message,
              estimatedTime: estimatedTimeSeconds,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          };

          // 初期進捗
          sendProgress(0, "リクエスト情報を解析中...");
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 参加者の要望を統合する関数
          function formatParticipantsPreferences(participants) {
            if (
              !participants ||
              !Array.isArray(participants) ||
              participants.length === 0
            ) {
              return "特になし";
            }

            return participants
              .map((participant, index) => {
                const name = participant.name || `参加者${index + 1}`;
                const age = participant.age ? `（${participant.age}歳）` : "";
                const wishes = participant.wishes || [];
                const interests = participant.interests || [];
                const restrictions = participant.restrictions || [];

                let participantInfo = `**${name}${age}:**\n`;

                if (wishes.length > 0) {
                  participantInfo += `- 行きたい場所: ${wishes.join(", ")}\n`;
                }

                if (interests.length > 0) {
                  participantInfo += `- 興味・関心: ${interests.join(", ")}\n`;
                }

                if (restrictions.length > 0) {
                  participantInfo += `- 制約・配慮事項: ${restrictions.join(
                    ", "
                  )}\n`;
                }

                if (participant.budget) {
                  participantInfo += `- 個人予算: ${participant.budget}\n`;
                }

                return participantInfo;
              })
              .join("\n");
          }

          sendProgress(20, "目的地の情報を収集中...");
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // 参加者の要望をフォーマット
          const participantsPreferences =
            formatParticipantsPreferences(participants);

          // 3つのプランを個別に生成
          const generateSinglePlan = async (
            planType,
            planNumber,
            progressStart,
            progressEnd
          ) => {
            // プランタイプに応じたプロンプト
            let planTypeDescription = "";
            switch (planType) {
              case "sunny_outdoor":
                planTypeDescription =
                  "屋外活動を中心とした晴天時向けプラン（自然観光、アウトドア体験、屋外グルメなど）";
                break;
              case "sunny_cultural":
                planTypeDescription =
                  "晴天時向けの文化・歴史中心プラン（寺社仏閣、美術館、伝統体験、街歩きなど）";
                break;
              case "rainy_indoor":
                planTypeDescription =
                  "屋内活動を中心とした雨天時向けプラン（屋内観光、ショッピング、屋内エンターテイメントなど）";
                break;
            }

            const singlePlanPrompt = `
以下の条件に基づいて、詳細な旅行プランを1つ作成してください。

**基本条件:**
- 目的地: ${destination}
- **旅行日数: ${duration || "適切な期間"}日間**
- 日付: ${date}
- 季節: ${season}
- 季節の考慮事項: ${seasonal_considerations}
- 予算: ${budget}
- 人数: ${number_of_people}
- 興味: ${interests}
- その他の要望: ${additional_requests}

**プランタイプ:** ${planTypeDescription}

**参加者の個別要望:**
${participantsPreferences}

**重要な制約事項:**
- 同じアクティビティや同じ場所への訪問は一度のみとしてください
- 各日の活動場所やアクティビティは全て異なるものにしてください
- 最新の観光情報や営業時間を考慮して、実用的なプランを作成してください

プランの詳細を以下の形式で作成してください：
- プラン番号: ${planNumber}
- 旅行ID: "${destination}_${planType}_${Date.now()}"
- 天候タイプ: "${planType.includes("rainy") ? "rainy" : "sunny"}"
- テーマに沿った魅力的なプランを作成してください
`;

            try {
              // 構造化出力を使用してJSONレスポンスを生成
              const response = await model.generateContent({
                contents: [
                  { role: "user", parts: [{ text: singlePlanPrompt }] },
                ],
                generationConfig: {
                  maxOutputTokens: 4000,
                  temperature: 0.7,
                  responseMimeType: "application/json",
                  responseSchema: planSchema,
                },
              });

              console.log(
                `Plan ${planNumber} Vertex AI response:`,
                JSON.stringify(response.response, null, 2)
              );

              let planData = null;
              if (
                response.response &&
                response.response.candidates &&
                response.response.candidates[0]
              ) {
                const candidate = response.response.candidates[0];
                if (
                  candidate.content &&
                  candidate.content.parts &&
                  candidate.content.parts[0]
                ) {
                  const responseText = candidate.content.parts[0].text;
                  console.log(
                    `Plan ${planNumber} extracted content:`,
                    responseText
                  );

                  try {
                    planData = JSON.parse(responseText);
                  } catch (parseError) {
                    console.error(
                      `JSON parse error for plan ${planNumber}:`,
                      parseError
                    );
                    throw new Error(
                      `Invalid JSON format in response for plan ${planNumber}: ${parseError.message}`
                    );
                  }
                }
              }

              if (!planData) {
                throw new Error(
                  `No valid plan data received for plan ${planNumber}`
                );
              }

              // プランデータの基本検証
              if (
                !planData.trip_id ||
                !planData.theme ||
                !planData.hero ||
                !planData.itinerary ||
                !Array.isArray(planData.itinerary)
              ) {
                throw new Error(
                  `Invalid structure in plan ${planNumber}: missing required fields`
                );
              }

              return planData;
            } catch (error) {
              console.error(`Error generating plan ${planNumber}:`, error);

              // フォールバック: 基本的なプラン構造を返す
              return {
                plan_number: planNumber,
                trip_id: `${destination}_${planType}_${Date.now()}`,
                weather_type: planType.includes("rainy") ? "rainy" : "sunny",
                theme:
                  planType === "sunny_outdoor"
                    ? "adventure"
                    : planType === "sunny_cultural"
                    ? "cultural"
                    : "indoor_comfort",
                theme_description: `${destination}での${planTypeDescription}を楽しむプラン`,
                hero: {
                  title: `${destination}旅行プラン${planNumber}`,
                  subtitle: planTypeDescription,
                  destination: destination,
                  date: date || "日程調整中",
                  budget: budget || "相談により決定",
                  highlights: [
                    `${destination}の魅力を満喫`,
                    "思い出に残る体験",
                    "最適なスケジュール",
                  ],
                },
                itinerary: [
                  {
                    day: 1,
                    date: new Date().toISOString().split("T")[0],
                    city: {
                      name: destination,
                      name_en: destination,
                      description: `${destination}での素晴らしい体験`,
                    },
                    activities: [
                      {
                        id: `${destination}_activity_1`,
                        time: "09:00 - 12:00",
                        title: `${destination}観光`,
                        subtitle: "主要スポット巡り",
                        type: "sightseeing",
                        priority: "must_see",
                        description: `${destination}の代表的な観光地を訪問`,
                        location: destination,
                        search_query: destination,
                        price: "入場料別途",
                        rating: 4.5,
                        tips: "早めの時間がおすすめ",
                        activity_english: `${destination} sightseeing`,
                        image_search_term: `${destination} tourism`,
                        category: "sightseeing",
                        is_free: false,
                      },
                    ],
                    accommodation: duration > 1 ? destination : "日帰り",
                  },
                ],
              };
            }
          };

          // プラン1: 屋外活動中心
          sendProgress(40, "プラン1（屋外活動）を作成中...");
          const plan1 = await generateSinglePlan("sunny_outdoor", 1, 40, 55);

          // プラン2: 文化・歴史中心
          sendProgress(55, "プラン2（文化・歴史）を作成中...");
          const plan2 = await generateSinglePlan("sunny_cultural", 2, 55, 75);

          // プラン3: 屋内活動中心
          sendProgress(75, "プラン3（屋内活動）を作成中...");
          const plan3 = await generateSinglePlan("rainy_indoor", 3, 75, 85);

          const plans = [plan1, plan2, plan3];

          sendProgress(85, "プランの最終調整中...");
          await new Promise((resolve) => setTimeout(resolve, 1000));

          sendProgress(90, "プランの準備完了...");

          // プランにタイムスタンプを追加
          const timestamp = new Date().toISOString();
          plans.forEach((plan) => {
            plan.created_at = timestamp;
            plan.request_data = {
              destination,
              date,
              season,
              seasonal_considerations,
              budget,
              number_of_people,
              interests,
              additional_requests,
              participants,
              duration,
            };
          });

          sendProgress(100, "完了しました！");
          await new Promise((resolve) => setTimeout(resolve, 500));

          // 完了データを送信
          const completeData = JSON.stringify({
            type: "complete",
            plans: plans,
          });
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
        } catch (error) {
          console.error("Error generating travel plan:", error);

          const errorData = JSON.stringify({
            type: "error",
            message: error.message,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in streaming endpoint:", error);
    return new Response(
      JSON.stringify({
        type: "error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
