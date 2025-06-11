import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// OpenAI クライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// デフォルトのプロンプトテンプレート
const defaultPromptTemplate = `
あなたは旅行プランの専門家です。以下の条件に基づいて、詳細な旅行プランを作成してください。
1日の最後には、その夜泊まるであろう宿泊地名を出力してください。

プランは以下の形式のJSONで出力してください：

{
  "title": "旅行プラン名",
  "destination": "目的地",
  "duration": "期間（日数）",
  "budget": "予算の目安",
  "schedule": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "city": "都市名（日本語）",
      "city_english": "City Name (English)",
      "image_search_term": "City Name travel scenery",
      "activities": [
        {
          "time": "HH:MM - HH:MM",
          "activity": "アクティビティの説明",
          "activity_english": "Activity description (English)",
          "image_search_term": "City Name + Activity in English",
          "category": "sightseeing, food, activity, shopping..etc"
          "is_free": "アクティビティにお金がかかるか否か（bool）"
          "fee": "入園料",
          "location": "場所の名称",
          "notes": "メモ（任意）"
        }
      ],
      "accommodation": "宿泊予定の場所（市・地域）"
    }
  ]
}

条件：
- 目的地: {{destination}}
- 期間: {{duration}}
- 予算: {{budget}}
- 興味: {{interests}}
- その他の要望: {{additional_requests}}
`;

// プロンプトテンプレートを保存する変数（実際のアプリケーションではデータベースなどに保存）
let currentPromptTemplate = defaultPromptTemplate;

// GET: プロンプトテンプレートを取得
export async function GET() {
  return NextResponse.json({ promptTemplate: currentPromptTemplate });
}

// POST: 旅行プランを生成
export async function POST(request) {
  try {
    const body = await request.json();
    
    // リクエストからパラメータを取得
    const { destination, duration, budget, interests, additional_requests, customPrompt } = body;
    
    // カスタムプロンプトが提供された場合は使用
    const promptToUse = customPrompt || currentPromptTemplate;
    
    // プロンプトにパラメータを埋め込む
    let filledPrompt = promptToUse
      .replace('{{destination}}', destination || '')
      .replace('{{duration}}', duration || '')
      .replace('{{budget}}', budget || '')
      .replace('{{interests}}', interests || '')
      .replace('{{additional_requests}}', additional_requests || '');
    
    // OpenAI APIを呼び出し
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'あなたは旅行プランの専門家です。JSONフォーマットで回答してください。' },
        { role: 'user', content: filledPrompt }
      ],
      response_format: { type: 'json_object' }
    });
    
    // レスポンスからJSONを抽出
    const responseContent = completion.choices[0].message.content;
    
    // JSONをパースして検証
    const travelPlan = JSON.parse(responseContent);
    
    return NextResponse.json(travelPlan);
  } catch (error) {
    console.error('Error generating travel plan:', error);
    return NextResponse.json(
      { error: 'Travel plan generation failed', message: error.message },
      { status: 500 }
    );
  }
}
