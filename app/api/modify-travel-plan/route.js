import OpenAI from "openai";
import { NextResponse } from 'next/server';

// OpenAI クライアントの初期化
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 旅行プラン修正API
 * POST: 指定されたプランの一部を修正
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // リクエストからパラメータを取得
    const { 
      original_plan,     // 元の旅行プラン（単一プラン）
      plan_number,       // 修正対象のプラン番号（1, 2, 3）
      modification_request, // ユーザーの修正要望
      full_plans_data    // 必要に応じて全プランデータ
    } = body;
    
    // 必須パラメータの検証
    if (!original_plan) {
      return NextResponse.json(
        { error: 'original_plan is required' },
        { status: 400 }
      );
    }
    
    if (!plan_number) {
      return NextResponse.json(
        { error: 'plan_number is required' },
        { status: 400 }
      );
    }
    
    if (!modification_request) {
      return NextResponse.json(
        { error: 'modification_request is required' },
        { status: 400 }
      );
    }
    
    // プロンプトを構築
    const modificationPrompt = `
あなたは旅行プランの専門家です。以下の旅行プランの一部を、ユーザーの要望に基づいて修正してください。

**元の旅行プラン:**
${JSON.stringify(original_plan, null, 2)}

**修正要望:**
${modification_request}

**重要な指示:**
- 元のプランの構造と形式を維持してください
- 修正要望に関連する部分のみを変更してください
- 他の要素（trip_id、基本的な hero 情報など）は可能な限り保持してください
- 修正後も実用的で実現可能なプランにしてください
- 時間の整合性を保ってください（移動時間、営業時間など）
- 参加者の要望も考慮してください

**出力形式:**
修正されたプランを以下の形式のJSONで出力してください。元のプランと同じ構造を維持してください。

{
  "plan_number": ${plan_number},
  "trip_id": "元のtrip_id",
  "weather_type": "元のweather_type",
  "theme": "テーマ（必要に応じて更新）",
  "theme_description": "テーマの説明（必要に応じて更新）",
  "hero": {
    // 元のhero情報（必要に応じて更新）
  },
  "itinerary": [
    // 修正されたitinerary
  ],
  "modification_summary": "今回の修正内容の簡潔な説明"
}

**注意事項:**
- JSONのみを返し、説明文やコメントは一切含めないでください
- 出力は必ず有効なJSON形式にしてください
`;
    
    // OpenAI API呼び出し
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "あなたは旅行プランの専門家です。ユーザーの要望に基づいて旅行プランを適切に修正してください。" 
        },
        { role: "user", content: modificationPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    // レスポンスの検証
    const messageContent = response.choices[0]?.message?.content;
    console.log('=== 修正プラン生成レスポンス ===');
    console.log(messageContent);

    if (!messageContent) {
      throw new Error('No content received from OpenAI API');
    }

    // JSONレスポンスをパース
    let modifiedPlan;
    try {
      modifiedPlan = JSON.parse(messageContent);
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Failed to parse JSON from API response');
    }

    // 基本的な構造の検証
    if (!modifiedPlan.trip_id || !modifiedPlan.theme || !modifiedPlan.hero || !modifiedPlan.itinerary || !Array.isArray(modifiedPlan.itinerary)) {
      throw new Error('Invalid modified plan structure');
    }
    
    // プラン番号の確認
    if (modifiedPlan.plan_number !== plan_number) {
      modifiedPlan.plan_number = plan_number;
    }
    
    // 修正時刻の追加
    modifiedPlan.modified_at = new Date().toISOString();
    modifiedPlan.original_trip_id = original_plan.trip_id;
    
    return NextResponse.json({
      success: true,
      modified_plan: modifiedPlan,
      original_plan_id: original_plan.trip_id,
      modification_request: modification_request
    });
    
  } catch (error) {
    console.error('Error modifying travel plan:', error);
    
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
        { error: 'Travel plan modification failed', message: error.message },
        { status: 500 }
      );
    }
  }
}