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

**季節に応じた特別配慮:**
- 旅行時期（{{season}}）に最適な服装、持ち物、アクティビティを考慮してください
- 季節特有のイベント、見どころ、グルメを積極的に取り入れてください
- 天候や気温に配慮した現実的なスケジュールを組んでください
- {{seasonal_considerations}}これらの要素を旅行プランに反映させてください

**参加者の個別要望:**
{{participants_preferences}}

**重要な制約事項:**
- **同じアクティビティや同じ場所への訪問は一度のみとし、旅行期間中に重複させないでください**
- 各日の活動場所やアクティビティは全て異なるものにしてください
- 同一施設や同一エリアでの複数回の訪問は避けてください
- レストランや飲食店も可能な限り重複しないようにしてください

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
- 現地の文化や慣習、営業時間、休業日なども考慮してください

**宿泊に関する要件:**
- 旅行期間が1日の場合：日帰りのため宿泊情報は不要
- 旅行期間が2日以上の場合：宿泊数 = 旅行期間 - 1日
  - 例：2日間 → 1泊、3日間 → 2泊、4日間 → 3泊
- 海外旅行の場合：移動日も含めた実質的な現地滞在を考慮してください
- 最終日以外の各日には、その夜泊まる宿泊地名を{accommodation}フィールドに出力してください
- 最終日は出発日のため{accommodation}は"出発日のため宿泊なし"または空文字列にしてください
- 海外の場合は都市名・地域名に加えて国名も含めてください

**その他の要件:**
- 一般的な観光情報に基づいて、実用的なプランを作成してください
- 移動時間や交通手段も考慮した現実的なスケジュールにしてください
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
              "description": "詳細な説明",
              "location": "場所の名称",
              "price": "料金",
              "rating": "評価（数値）",
              "tips": "おすすめのポイントやコツ",
              "activity_english": "Activity description (English)",
              "image_search_term": "City Name + Activity in English",
              "category": "sightseeing, food, activity, shopping..etc",
              "is_free": "アクティビティにお金がかかるか否か（bool）",
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

// プロンプトテンプレートを保存する変数
let currentPromptTemplate = defaultPromptTemplate;

// GET: プロンプトテンプレートを取得
export async function GET() {
  return NextResponse.json({ promptTemplate: currentPromptTemplate });
}

// PUT: プロンプトテンプレートを更新
export async function PUT(request) {
  try {
    const body = await request.json();
    const { promptTemplate } = body;

    if (!promptTemplate) {
      return NextResponse.json(
        { error: "promptTemplate is required" },
        { status: 400 }
      );
    }

    currentPromptTemplate = promptTemplate;
    return NextResponse.json({
      message: "Prompt template updated successfully",
    });
  } catch (error) {
    console.error("Error updating prompt template:", error);
    return NextResponse.json(
      { error: "Failed to update prompt template", message: error.message },
      { status: 500 }
    );
  }
}

// 単一プラン生成用ヘルパー関数
async function generateSinglePlan(requestData, planType, planNumber) {
  const singlePlanPrompt = `
あなたは旅行プランの専門家です。以下の条件に基づいて、詳細な旅行プランを1つ作成してください。

**基本条件:**
- 目的地: ${requestData.destination}
- 日付: ${requestData.date}
- 季節: ${requestData.season}
- 季節の考慮事項: ${requestData.seasonal_considerations}
- 予算: ${requestData.budget}
- 人数: ${requestData.number_of_people}
- 興味: ${requestData.interests}
- その他の要望: ${requestData.additional_requests}
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
${requestData.participants_preferences}

**重要な制約事項:**
- 同じアクティビティや同じ場所への訪問は一度のみとしてください
- 各日の活動場所やアクティビティは全て異なるものにしてください
- 最新の観光情報や営業時間を考慮して、実用的なプランを作成してください

**出力形式:**
以下の形式のJSONで1つのプランを出力してください：
{
  "plan_number": ${planNumber},
  "trip_id": "${requestData.destination}_${planType}_${Date.now()}",
  "weather_type": "${planType.includes("rainy") ? "rainy" : "sunny"}",
  "theme": "旅行のテーマ",
  "theme_description": "このプランのテーマの説明",
  "hero": {
    "title": "メインタイトル",
    "subtitle": "サブタイトル・キャッチフレーズ",
    "destination": "${requestData.destination}",
    "date": "${requestData.date}",
    "budget": "${requestData.budget}",
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
          "description": "詳細な説明",
          "location": "場所の名称",
          "price": "料金",
          "rating": 4.5,
          "tips": "おすすめのポイント",
          "activity_english": "Activity description (English)",
          "image_search_term": "City Name + Activity in English",
          "category": "sightseeing/food/activity/shopping等",
          "is_free": false
        }
      ],
      "accommodation": "宿泊予定の場所"
    }
  ]
}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-search-preview-2025-03-11", // GPT-4o-search-previewを使用
    messages: [
      {
        role: "system",
        content:
          "あなたは旅行プランの専門家です。最新の観光情報を検索して、詳細で実用的な旅行プランを作成してください。指定されたJSON形式で正確に出力してください。",
      },
      { role: "user", content: singlePlanPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
  });

  const messageContent = response.choices[0]?.message?.content;
  if (!messageContent) {
    throw new Error(`No content received for plan ${planNumber}`);
  }

  return JSON.parse(messageContent);
}

// POST: 旅行プランを生成（プランごとに分離）
export async function POST(request) {
  try {
    // OpenAI APIキーのチェック
    if (!client) {
      console.log("OpenAI API key not configured, returning mock data");
      const { getMockPlans } = await import("../../../data/mockData");
      const mockPlans = getMockPlans();
      return NextResponse.json({ plans: mockPlans.slice(0, 3) });
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
      participants,
    } = body;

    // 必須パラメータの検証
    if (!destination) {
      return NextResponse.json(
        { error: "destination is required" },
        { status: 400 }
      );
    }

    // 参加者の要望をフォーマット
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
            participantInfo += `- 制約・配慮事項: ${restrictions.join(", ")}\n`;
          }

          if (participant.budget) {
            participantInfo += `- 個人予算: ${participant.budget}\n`;
          }

          return participantInfo;
        })
        .join("\n");
    }

    // リクエストデータを整理
    const requestData = {
      destination: destination || "",
      date: date || "",
      season: season || "",
      seasonal_considerations: seasonal_considerations || "",
      budget: budget || "",
      number_of_people: number_of_people || "",
      interests: interests || "",
      additional_requests: additional_requests || "",
      participants_preferences: formatParticipantsPreferences(participants),
    };

    console.log("=== Generating 3 separate travel plans ===");

    // 3つのプランを並行して生成
    const planPromises = [
      generateSinglePlan(requestData, "sunny_outdoor", 1),
      generateSinglePlan(requestData, "sunny_cultural", 2),
      generateSinglePlan(requestData, "rainy_indoor", 3),
    ];

    const plans = await Promise.all(planPromises);

    console.log("=== All plans generated successfully ===");
    console.log(`Plan 1: ${plans[0].theme}`);
    console.log(`Plan 2: ${plans[1].theme}`);
    console.log(`Plan 3: ${plans[2].theme}`);

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
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error generating travel plan:", error);

    // エラーの種類に応じたレスポンス
    if (error.status === 401) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    } else if (error.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    } else {
      return NextResponse.json(
        { error: "Travel plan generation failed", message: error.message },
        { status: 500 }
      );
    }
  }
}
