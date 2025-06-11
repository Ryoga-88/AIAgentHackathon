import OpenAI from "openai";
import { NextResponse } from 'next/server';

// OpenAI クライアントの初期化
const client = new OpenAI({
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
          "category": "sightseeing, food, activity, shopping..etc",
          "is_free": "アクティビティにお金がかかるか否か（bool）",
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
- 人数: {{number_of_people}}
- 興味: {{interests}}
- その他の要望: {{additional_requests}}

一般的な観光情報に基づいて、実用的なプランを作成してください。
JSONのみを返し、説明文は含めないでください。
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
    
    // OpenAI Chat Completions APIを呼び出し（Function Callingを削除）
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "あなたは旅行プランの専門家です。指定されたJSON形式で正確に回答してください。" 
        },
        { role: "user", content: filledPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }, // JSON形式での応答を強制
    });
    
    // レスポンスの検証
    const messageContent = response.choices[0]?.message?.content;
    
    if (!messageContent) {
      throw new Error('No content received from OpenAI API');
    }
    
    // JSONをパースして検証
    let travelPlan;
    try {
      travelPlan = JSON.parse(messageContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON response from API');
    }
    
    // 基本的な構造の検証
    if (!travelPlan.title || !travelPlan.schedule || !Array.isArray(travelPlan.schedule)) {
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