import OpenAI from "openai";
import { NextResponse } from 'next/server';

// OpenAI クライアントの初期化
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// デフォルトのプロンプトテンプレート
const defaultPromptTemplate = `
あなたは旅行プランの専門家です。以下の条件に基づいて、詳細な旅行プランを作成してください。

**基本条件:**
- 目的地: {{destination}}
- 期間: {{duration}}
- 予算: {{budget}}
- 人数: {{number_of_people}}
- 興味: {{interests}}
- その他の要望: {{additional_requests}}

**重要な制約事項:**
- **同じアクティビティや同じ場所への訪問は一度のみとし、旅行期間中に重複させないでください**
- 各日の活動場所やアクティビティは全て異なるものにしてください
- 同一施設や同一エリアでの複数回の訪問は避けてください
- レストランや飲食店も可能な限り重複しないようにしてください

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
- JSONのみを返し、説明文は含めないでください

**出力形式:**
プランは以下の形式のJSONで出力してください：
{
  "trip_id": "旅行ID（一意識別子）",
  "theme": "旅行のテーマ（例：wabi_sabi, adventure, relax等）",
  "hero": {
    "title": "メインタイトル",
    "subtitle": "サブタイトル・キャッチフレーズ",
    "destination": "目的地",
    "duration": "期間（日数）",
    "budget": "予算の目安",
    "hero_image": "メイン画像URL",
    "key_visual": {
      "main_image": "メイン画像URL",
      "alt_images": [
        "代替画像URL1",
        "代替画像URL2"
      ],
      "mood": "画像の雰囲気（例：serene_traditional, vibrant_modern等）"
    },
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
        "image": "都市の画像URL"
      },
      "activities": [
        {
          "id": "アクティビティID（一意識別子）",
          "time": "HH:MM - HH:MM",
          "title": "アクティビティのタイトル",
          "subtitle": "アクティビティのサブタイトル",
          "type": "アクティビティの種類（heritage, culinary, experience, scenic等）",
          "priority": "優先度（must_see, must_do, recommended等）",
          "image": "アクティビティの画像URL",
          "description": "詳細な説明",
          "location": "場所の名称",
          "price": "料金",
          "rating": "評価（数値）",
          "tips": "おすすめのポイントやコツ",
          "activity_english": "Activity description (English)",
          "image_search_term": "City Name + Activity in English",
          "category": "sightseeing, food, activity, shopping..etc",
          "is_free": "アクティビティにお金がかかるか否か（bool）",
          "fee": "入園料",
          "notes": "メモ（任意）"
        }
      ],
      "accommodation": "宿泊予定の場所（市・地域）"
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
        { error: 'promptTemplate is required' },
        { status: 400 }
      );
    }
    
    currentPromptTemplate = promptTemplate;
    return NextResponse.json({ message: 'Prompt template updated successfully' });
  } catch (error) {
    console.error('Error updating prompt template:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt template', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 文字列からMarkdownのコードブロック記号を削除し、JSON形式に整形する関数
 * @param {string} inputString - 整形したい文字列
 * @returns {Object|null} - パースされたJSONオブジェクト、エラーの場合はnull
 */
function cleanAndParseJSON(inputString) {
  try {
    // 文字列の前後の空白を除去
    let cleanedString = inputString.trim();
    
    // ```json または ``` で始まる行を削除
    cleanedString = cleanedString.replace(/^```json\s*/m, '');
    cleanedString = cleanedString.replace(/^```\s*/m, '');
    
    // 末尾の ``` を削除
    cleanedString = cleanedString.replace(/\s*```\s*$/m, '');
    
    // 再度前後の空白を除去
    cleanedString = cleanedString.trim();
    
    // JSONをパースして返す
    return JSON.parse(cleanedString);
    
  } catch (error) {
    console.error('JSON parsing error:', error.message);
    console.error('Problematic string:', cleanedString);
    return null;
  }
}

// POST: 旅行プランを生成
export async function POST(request) {
  try {
    const body = await request.json();
    
    // リクエストからパラメータを取得
    const { 
      destination, 
      duration, 
      budget, 
      number_of_people, 
      interests, 
      additional_requests, 
      customPrompt 
    } = body;
    
    // 必須パラメータの検証
    if (!destination) {
      return NextResponse.json(
        { error: 'destination is required' },
        { status: 400 }
      );
    }
    
    // カスタムプロンプトが提供された場合は使用
    const promptToUse = customPrompt || currentPromptTemplate;
    
    // プロンプトにパラメータを埋め込む
    let filledPrompt = promptToUse
      .replace('{{destination}}', destination || '')
      .replace('{{duration}}', duration || '')
      .replace('{{budget}}', budget || '')
      .replace('{{number_of_people}}', number_of_people || '')
      .replace('{{interests}}', interests || '')
      .replace('{{additional_requests}}', additional_requests || '');
    
    // OpenAI Chat Completions APIを呼び出し(検索機能持ちプランニングモデル)
    const response1 = await client.chat.completions.create({
      model: "gpt-4o-search-preview-2025-03-11",
      messages: [
        { 
          role: "system", 
          content: "あなたは旅行プランの専門家です。指定されたJSON形式で正確に回答してください。" 
        },
        { role: "user", content: filledPrompt }
      ],
      // max_tokens: 4000,
    });
    
    // レスポンスの検証
    const messageContent1 = response1.choices[0]?.message?.content;
    console.log('=== 生のレスポンス ===');
    console.log(messageContent1);

    if (!messageContent1) {
      throw new Error('No content received from OpenAI API');
    }

    // 新しいJSON整形関数を使用
    const parsedJSON = cleanAndParseJSON(messageContent1);

    if (parsedJSON === null) {
      console.error('JSONの解析に失敗しました');
      throw new Error('Failed to parse JSON from API response');
    }

    console.log('=== 解析されたJSONオブジェクト ===');
    console.log(parsedJSON);

    // // 出力をjson形式に編集するLLM
    // const response2 = await client.chat.completions.create({
    //   model: "gpt-4o-mini-2024-07-18",
    //   messages: [
    //     { 
    //       role: "system", 
    //       content: "あなたは入力をJSON形式に修正する専門家です。正確に回答してください。" 
    //     },
    //     { role: "user", content: messageContent1 }
    //   ],
    //   temperature: 0.7,
    //   max_tokens: 4000,
    //   response_format: { type: "json_object" }, // JSON形式での応答を強制
    // });
    
    // // レスポンスの検証
    // const messageContent2 = response2.choices[0]?.message?.content;
    
    // if (!messageContent2) {
    //   throw new Error('No content received from OpenAI API');
    // }

    let travelPlan = parsedJSON
    // 基本的な構造の検証
    if (!travelPlan.trip_id || !travelPlan.theme || !travelPlan.hero || !travelPlan.itinerary || !Array.isArray(travelPlan.itinerary)) {
      throw new Error('Invalid travel plan structure');
    }
    
    return NextResponse.json(travelPlan);
    
  } catch (error) {
    console.error('Error generating travel plan:', error);
    
    // エラーの種類に応じたレスポンス
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    } else if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    } else {
      return NextResponse.json(
        { error: 'Travel plan generation failed', message: error.message },
        { status: 500 }
      );
    }
  }
}