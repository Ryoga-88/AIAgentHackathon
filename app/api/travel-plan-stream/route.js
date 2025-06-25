import OpenAI from "openai";
import { NextResponse } from "next/server";

// OpenAI クライアントの初期化（APIキーがない場合はnull）
let client = null;
try {
  if (process.env.OPENAI_API_KEY) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.log("OpenAI client initialization failed:", error.message);
}

// デフォルトのプロンプトテンプレート（Search API向けに最適化）
const defaultPromptTemplate = `
あなたは旅行プランの専門家です。最新の観光情報、営業時間、料金情報を検索して、現在の正確な情報に基づいて詳細な旅行プランを作成してください。

**基本条件:**
- 目的地: {{destination}}
- 日付: {{date}}
- 季節: {{season}}
- 季節の考慮事項: {{seasonal_considerations}}
- 予算: {{budget}}
- 人数: {{number_of_people}}
- 興味: {{interests}}
- その他の要望: {{additional_requests}}

**検索・調査指示:**
1. 目的地の最新の観光情報、人気スポット、営業時間、料金を検索してください
2. 現在の季節（{{season}}）に最適な観光地、イベント、グルメ情報を調査してください
3. 最新の交通情報、アクセス方法、所要時間を確認してください
4. 現在の宿泊施設の料金相場、人気エリアを調査してください
5. 最新のレストラン情報、営業時間、予約の必要性を確認してください

**参加者の個別要望:**
{{participants_preferences}}

**重要な制約事項:**
- **同じアクティビティや同じ場所への訪問は一度のみとし、旅行期間中に重複させないでください**
- 各日の活動場所やアクティビティは全て異なるものにしてください
- 同一施設や同一エリアでの複数回の訪問は避けてください
- レストランや飲食店も可能な限り重複しないようにしてください
- **必ず最新の営業時間、定休日、料金を確認して現実的なスケジュールを作成してください**

**複数人の要望統合ガイドライン:**
- すべての参加者の希望を可能な限り旅行プランに含めてください
- 相反する要望がある場合は、バランスを取りながら妥協案を提示してください
- 各参加者の「行きたい場所」は優先的にプランに組み込んでください
- 特定の参加者だけの要望ではなく、全員が楽しめる活動を優先してください
- 年齢層や体力差がある場合は、全員が参加できる活動を選んでください

**海外旅行の特別考慮事項:**
- 海外旅行の場合、移動日（往復の航空機利用日）も旅行期間に含めて計算してください
- 時差がある場合は現地時刻でスケジュールを作成してください
- フライト時間、空港での手続き時間、移動時間を十分に考慮してください
- 到着日と出発日は移動時間を考慮して活動時間を調整してください
- 通貨は現地通貨で表記し、必要に応じて日本円での目安も併記してください
- 現地の文化や慣習、営業時間、休業日なども最新情報を検索して考慮してください

**宿泊に関する要件:**
- 旅行期間が1日の場合：日帰りのため宿泊情報は不要
- 旅行期間が2日以上の場合：宿泊数 = 旅行期間 - 1日
- 最新の宿泊施設情報、料金相場を検索して現実的な提案をしてください
- 最終日以外の各日には、その夜泊まる宿泊地名を{accommodation}フィールドに出力してください
- 最終日は出発日のため{accommodation}は"出発日のため宿泊なし"または空文字列にしてください

**経路探索用の場所情報について:**
- 各アクティビティに "search_query" フィールドを必ず追加してください
- 具体的な観光地・施設がある場合：正確な場所名 + 地域名（例："清水寺 京都市", "函館山 北海道"）
- 抽象的な活動の場合：空文字列 ""
- 必ず実在する場所のみを記載し、最新の営業状況を確認してください

**その他の要件:**
- **最新の観光情報、営業時間、料金情報を検索して反映してください**
- 移動時間や交通手段も最新情報を考慮した現実的なスケジュールにしてください
- **JSONのみを返し、説明文やコメントは一切含めないでください**
- **出力は必ず有効なJSON形式にしてください**

**重要な指示:**
**必ず3つの異なる旅行プランを作成してください。以下の構成で作成してください：**
- **プラン1（晴れの日用）**: 屋外活動を中心とした晴天時向けプラン
- **プラン2（晴れの日用）**: 晴天時向けの別アプローチ（プラン1とは異なる視点・テーマ）
- **プラン3（雨の日用）**: 屋内活動を中心とした雨天時向けプラン

参加者の要望を満たしつつ、天候に応じた最適な活動を提案してください。

**出力形式:**
以下の形式のJSONで**3つのプラン**を配列として出力してください：
{
  "plans": [
    {
      "plan_number": 1,
      "trip_id": "旅行ID（一意識別子）",
      "weather_type": "sunny",
      "theme": "旅行のテーマ（例：wabi_sabi, adventure, relax等）",
      "theme_description": "このプランのテーマの説明",
      "hero": {
        "title": "メインタイトル",
        "subtitle": "サブタイトル・キャッチフレーズ",
        "destination": "目的地",
        "date": "日付",
        "budget": "予算の目安",
        "highlights": [
          "旅行のハイライト1",
          "旅行のハイライト2",
          "旅行のハイライト3"
        ]
      },
      "itinerary": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "city": {
            "name": "都市名（日本語）",
            "name_en": "City Name (English)",
            "description": "都市の説明・特徴",
          },
          "activities": [
            {
              "id": "アクティビティID（一意識別子）",
              "time": "HH:MM - HH:MM",
              "title": "アクティビティのタイトル",
              "subtitle": "アクティビティのサブタイトル",
              "type": "アクティビティの種類（heritage, culinary, experience, scenic等）",
              "priority": "優先度（must_see, must_do, recommended等）",
              "description": "詳細な説明（最新情報を含む）",
              "location": "場所の名称",
              "search_query": "Google Maps検索用クエリ（具体的な場所がある場合のみ、ない場合は空文字列）",
              "price": "料金（最新情報）",
              "rating": "評価（数値）",
              "tips": "おすすめのポイントやコツ（最新情報を含む）",
              "activity_english": "Activity description (English)",
              "image_search_term": "City Name + Activity in English",
              "category": "sightseeing, food, activity, shopping..etc",
              "is_free": "アクティビティにお金がかかるか否か（bool）",
              "operating_hours": "営業時間（最新情報）",
              "closed_days": "定休日（最新情報）",
              "booking_required": "予約の必要性（bool）"
            }
          ],
          "accommodation": "宿泊予定の場所（市・地域）"
        }
      ]
    },
    {
      "plan_number": 2,
      "weather_type": "sunny",
      "trip_id": "旅行ID2",
      "theme": "別のテーマ",
      "theme_description": "2つ目の晴れの日プランの説明（完全な構造を含む）"
    },
    {
      "plan_number": 3,
      "weather_type": "rainy",
      "trip_id": "旅行ID3",
      "theme": "雨の日テーマ",
      "theme_description": "雨の日プランの説明（屋内活動中心・完全な構造を含む）"
    }
  ]
}
`;

// ストリーミング対応のPOSTエンドポイント
export async function POST(request) {
  try {
    // OpenAI APIキーのチェック
    if (!client) {
      console.log("OpenAI API key not configured, returning mock data");
      // APIキーがない場合はモックデータを返す
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

    // 推定処理時間の計算（Search APIは時間がかかる可能性があるため調整）
    const estimatedTimeMinutes = (duration || 3) + 2; // 検索時間を考慮して+2分
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

          sendProgress(15, "最新の観光情報を検索中...");
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // カスタムプロンプトが提供された場合は使用
          const promptToUse = customPrompt || defaultPromptTemplate;

          // 参加者の要望をフォーマット
          const participantsPreferences =
            formatParticipantsPreferences(participants);

          // プロンプトにパラメータを埋め込む
          let filledPrompt = promptToUse
            .replace("{{destination}}", destination || "")
            .replace(
              "{{date}}",
              date || "日程未指定（適切な期間を設定してください）"
            )
            .replace("{{season}}", season || "年間を通して楽しめる")
            .replace(
              "{{seasonal_considerations}}",
              seasonal_considerations || "特になし"
            )
            .replace(
              "{{budget}}",
              budget || "一般的な予算（適切な金額を設定してください）"
            )
            .replace("{{number_of_people}}", number_of_people || "")
            .replace("{{interests}}", interests || "")
            .replace("{{additional_requests}}", additional_requests || "")
            .replace("{{participants_preferences}}", participantsPreferences);

          sendProgress(30, "営業時間・料金情報を調査中...");
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // 3つのプランを個別に生成（Search API使用）
          const generateSinglePlan = async (
            planType,
            planNumber,
            progressStart,
            progressEnd
          ) => {
            const singlePlanPrompt = `
あなたは旅行プランの専門家です。最新の観光情報を検索して、以下の条件に基づいた詳細な旅行プランを1つ作成してください。

**検索指示:**
まず「${destination}」の最新の観光情報、営業時間、料金、アクセス情報を検索してください。
特に以下の点を重点的に調査してください：
- 人気観光スポットの営業時間と料金
- 現在の季節（${season}）におすすめのアクティビティ
- 交通アクセスと所要時間
- 宿泊施設の相場と人気エリア
- レストランの営業時間と予約の必要性

**基本条件:**
- 目的地: ${destination}
- 日付: ${date}
- 季節: ${season}
- 季節の考慮事項: ${seasonal_considerations}
- 予算: ${budget}
- 人数: ${number_of_people}
- 興味: ${interests}
- その他の要望: ${additional_requests}
- プランタイプ: ${planType}

**プランタイプ別の特別配慮:**
${
  planType === "sunny_outdoor"
    ? "- 屋外活動を中心とした晴天時向けプラン（自然観光、アウトドア体験、屋外グルメなど）"
    : ""
}
${
  planType === "sunny_cultural"
    ? "- 晴天時向けの文化・歴史中心プラン（寺社仏閣、美術館、伝統体験、街歩きなど）"
    : ""
}
${
  planType === "rainy_indoor"
    ? "- 屋内活動を中心とした雨天時向けプラン（屋内観光、ショッピング、屋内エンターテイメントなど）"
    : ""
}

**参加者の個別要望:**
${participantsPreferences}

**重要な制約事項:**
- 同じアクティビティや同じ場所への訪問は一度のみとしてください
- 各日の活動場所やアクティビティは全て異なるものにしてください
- 必ず最新の営業時間、定休日、料金を検索して反映してください
- 現実的で実行可能なスケジュールを作成してください

**出力形式:**
以下の形式のJSONで1つのプランを出力してください：
{
  "plan_number": ${planNumber},
  "trip_id": "${destination}_${planType}_${Date.now()}",
  "weather_type": "${planType.includes("rainy") ? "rainy" : "sunny"}",
  "theme": "旅行のテーマ",
  "theme_description": "このプランのテーマの説明",
  "hero": {
    "title": "メインタイトル",
    "subtitle": "サブタイトル・キャッチフレーズ",
    "destination": "${destination}",
    "date": "${date}",
    "budget": "${budget}",
    "highlights": ["ハイライト1", "ハイライト2", "ハイライト3"]
  },
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "city": {
        "name": "都市名（日本語）",
        "name_en": "City Name (English)",
        "description": "都市の説明・特徴"
      },
      "activities": [
        {
          "id": "アクティビティID",
          "time": "HH:MM - HH:MM",
          "title": "アクティビティのタイトル",
          "subtitle": "アクティビティのサブタイトル",
          "type": "heritage/culinary/experience/scenic等",
          "priority": "must_see/must_do/recommended等",
          "description": "詳細な説明（最新情報を含む）",
          "location": "場所の名称",
          "search_query": "Google Maps検索用クエリ",
          "price": "料金（最新情報）",
          "rating": 4.5,
          "tips": "おすすめのポイント（最新情報を含む）",
          "activity_english": "Activity description (English)",
          "image_search_term": "City Name + Activity in English",
          "category": "sightseeing/food/activity/shopping等",
          "is_free": false,
          "operating_hours": "営業時間（最新情報）",
          "closed_days": "定休日（最新情報）",
          "booking_required": false
        }
      ],
      "accommodation": "宿泊予定の場所"
    }
  ]
}`;

            // Search APIを使用してプランを生成
            const response = await client.chat.completions.create({
              model: "gpt-4o-2024-08-06", // Search対応モデルを使用
              messages: [
                {
                  role: "system",
                  content:
                    "あなたは旅行プランの専門家です。必ず最新の観光情報、営業時間、料金を検索して、現在の正確な情報に基づいて詳細で実用的な旅行プランを作成してください。指定されたJSON形式で正確に出力してください。",
                },
                { role: "user", content: singlePlanPrompt },
              ],
              response_format: { type: "json_object" },
              max_tokens: 4000,
              temperature: 0.7, // Search APIでは少し創造性を持たせる
            });

            const messageContent = response.choices[0]?.message?.content;
            if (!messageContent) {
              throw new Error(`No content received for plan ${planNumber}`);
            }

            return JSON.parse(messageContent);
          };

          // プラン1: 屋外活動中心
          sendProgress(45, "プラン1（屋外活動）を作成中...");
          const plan1 = await generateSinglePlan("sunny_outdoor", 1, 45, 60);

          sendProgress(60, "プラン2（文化・歴史）を作成中...");
          // プラン2: 文化・歴史中心
          const plan2 = await generateSinglePlan("sunny_cultural", 2, 60, 75);

          sendProgress(75, "プラン3（屋内活動）を作成中...");
          // プラン3: 屋内活動中心
          const plan3 = await generateSinglePlan("rainy_indoor", 3, 75, 90);

          const plans = [plan1, plan2, plan3];

          sendProgress(90, "プランの最終調整・検証中...");
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 各プランの構造検証
          plans.forEach((plan, index) => {
            if (
              !plan.trip_id ||
              !plan.theme ||
              !plan.hero ||
              !plan.itinerary ||
              !Array.isArray(plan.itinerary)
            ) {
              throw new Error(`Invalid structure in plan ${index + 1}`);
            }

            // 追加の検証：最新情報が含まれているかチェック
            plan.itinerary.forEach((day) => {
              if (day.activities) {
                day.activities.forEach((activity) => {
                  if (
                    !activity.operating_hours &&
                    activity.category !== "outdoor"
                  ) {
                    console.warn(
                      `Warning: Missing operating hours for ${activity.title}`
                    );
                  }
                });
              }
            });
          });

          sendProgress(100, "最新情報を反映した旅行プランが完成しました！");
          await new Promise((resolve) => setTimeout(resolve, 500));

          // 完了データを送信
          const completeData = JSON.stringify({
            type: "complete",
            plans: plans,
            search_api_used: true, // Search APIが使用されたことを示すフラグ
            generated_at: new Date().toISOString(),
          });
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
        } catch (error) {
          console.error("Error generating travel plan with Search API:", error);

          const errorData = JSON.stringify({
            type: "error",
            message: `Search API Error: ${error.message}`,
            search_api_used: true,
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
        "X-Search-API": "enabled", // Search API使用を示すヘッダー
      },
    });
  } catch (error) {
    console.error("Error in streaming endpoint:", error);
    return new Response(
      JSON.stringify({
        type: "error",
        message: error.message,
        search_api_used: true,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
