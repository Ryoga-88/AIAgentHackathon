import OpenAI from "openai";
import { NextResponse } from 'next/server';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

export async function POST(request) {
  try {
    const body = await request.json();
    
    const { 
      original_plan,
      plan_number,
      modification_request,
      full_plans_data
    } = body;

    console.log('=== 修正リクエスト受信 ===');
    console.log('Original plan ID:', original_plan?.trip_id);
    console.log('Modification request:', modification_request);

    // 必須パラメータの検証
    if (!original_plan) {
      return NextResponse.json(
        { error: 'original_plan is required' },
        { status: 400 }
      );
    }
    
    if (!modification_request || modification_request.trim() === '') {
      return NextResponse.json(
        { error: 'modification_request is required' },
        { status: 400 }
      );
    }

    // プロンプトを構築
    const modificationPrompt = `
あなたは旅行プランの専門家です。以下の旅行プランをベースに、ユーザーの要望を反映した修正版を作成してください。

**元の旅行プラン:**
${JSON.stringify(original_plan, null, 2)}

**ユーザーの修正要望:**
${modification_request}

**重要な指示:**
1. 元のプランの基本構造は可能な限り維持してください
2. ユーザーの要望を積極的に反映してください
3. 出力は必ず有効なJSONのみとしてください
4. 説明文や前置きは一切含めないでください
5. 必須フィールドを全て含めてください

**出力JSON構造:**
{
  "trip_id": "modified_${original_plan.trip_id || 'plan'}_${Date.now()}",
  "plan_number": ${plan_number || 1},
  "weather_type": "${original_plan.weather_type || 'clear'}",
  "theme": "修正されたテーマ",
  "theme_description": "テーマの説明",
  "hero": {
    "title": "修正されたプランタイトル",
    "subtitle": "サブタイトル",
    "destination": "${original_plan.hero?.destination || '目的地'}",
    "duration": "${original_plan.hero?.duration || '期間'}",
    "budget": "${original_plan.hero?.budget || '予算未設定'}",
    "highlights": ["修正されたハイライト1", "ハイライト2", "ハイライト3"],
    "hero_image": "${original_plan.hero?.hero_image || ''}"
  },
  "itinerary": [
    // 元のitineraryをベースに、ユーザーの要望を反映して修正
    // 各日の構造は元のプランと同じ形式を維持
  ],
  "modification_summary": "今回の修正内容の簡潔な説明"
}
`;
    
    console.log('=== OpenAI API呼び出し開始 ===');

    // OpenAI API呼び出し
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "あなたは旅行プランの専門家です。与えられたプランを適切に修正し、有効なJSONのみを出力してください。説明は一切不要です。" 
        },
        { role: "user", content: modificationPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    });
    
    const messageContent = response.choices[0]?.message?.content;
    console.log('=== OpenAI レスポンス ===');
    console.log('Content length:', messageContent?.length || 0);
    console.log('Content preview:', messageContent?.substring(0, 200) + '...');

    if (!messageContent) {
      throw new Error('OpenAI APIからレスポンスが返されませんでした');
    }

    // JSONレスポンスをパース
    let modifiedPlan;
    try {
      modifiedPlan = JSON.parse(messageContent);
      console.log('=== JSON パース成功 ===');
      console.log('Parsed plan keys:', Object.keys(modifiedPlan));
    } catch (error) {
      console.error('=== JSON パースエラー ===', error);
      console.error('Raw content:', messageContent);
      throw new Error('OpenAI APIからの応答が有効なJSONではありません');
    }

    // データの補完と検証（緩和版）
    console.log('=== データ補完開始 ===');

    // 必須フィールドの補完
    if (!modifiedPlan.trip_id) {
      modifiedPlan.trip_id = `modified_${original_plan.trip_id || 'plan'}_${Date.now()}`;
      console.log('Trip ID補完:', modifiedPlan.trip_id);
    }

    if (!modifiedPlan.plan_number) {
      modifiedPlan.plan_number = plan_number || 1;
      console.log('Plan number補完:', modifiedPlan.plan_number);
    }

    if (!modifiedPlan.weather_type) {
      modifiedPlan.weather_type = original_plan.weather_type || 'clear';
      console.log('Weather type補完:', modifiedPlan.weather_type);
    }

    if (!modifiedPlan.theme) {
      modifiedPlan.theme = original_plan.theme || '修正されたテーマ';
      console.log('Theme補完:', modifiedPlan.theme);
    }

    if (!modifiedPlan.theme_description) {
      modifiedPlan.theme_description = original_plan.theme_description || 'ユーザーの要望を反映したプランです';
      console.log('Theme description補完');
    }

    // heroフィールドの補完
    if (!modifiedPlan.hero) {
      modifiedPlan.hero = { ...original_plan.hero };
      console.log('Hero section補完');
    } else {
      // hero内の必須フィールドを補完
      if (!modifiedPlan.hero.title) {
        modifiedPlan.hero.title = original_plan.hero?.title || '修正されたプラン';
      }
      if (!modifiedPlan.hero.destination) {
        modifiedPlan.hero.destination = original_plan.hero?.destination || '目的地';
      }
      if (!modifiedPlan.hero.duration) {
        modifiedPlan.hero.duration = original_plan.hero?.duration || '期間未設定';
      }
      if (!modifiedPlan.hero.budget) {
        modifiedPlan.hero.budget = original_plan.hero?.budget || '予算未設定';
      }
      if (!modifiedPlan.hero.highlights || !Array.isArray(modifiedPlan.hero.highlights)) {
        modifiedPlan.hero.highlights = original_plan.hero?.highlights || ['修正されたプラン'];
      }
    }

    // itineraryの補完
    if (!modifiedPlan.itinerary || !Array.isArray(modifiedPlan.itinerary)) {
      modifiedPlan.itinerary = original_plan.itinerary || [];
      console.log('Itinerary補完:', modifiedPlan.itinerary.length, 'days');
    }

    // itinerary内のデータ構造を検証・補完
    modifiedPlan.itinerary = modifiedPlan.itinerary.map((day, index) => {
      if (!day.day) {
        day.day = index + 1;
      }
      if (!day.activities || !Array.isArray(day.activities)) {
        day.activities = [];
      }
      // activitiesの各要素に最低限必要なフィールドを確保
      day.activities = day.activities.map((activity, actIndex) => {
        if (!activity.id) {
          activity.id = `activity_${day.day}_${actIndex + 1}`;
        }
        if (!activity.title) {
          activity.title = '未設定のアクティビティ';
        }
        return activity;
      });
      return day;
    });

    if (!modifiedPlan.modification_summary) {
      modifiedPlan.modification_summary = 'ユーザーの要望に基づいてプランを修正しました';
    }

    // メタデータを追加
    modifiedPlan.modified_at = new Date().toISOString();
    modifiedPlan.original_trip_id = original_plan.trip_id;
    modifiedPlan.modification_request = modification_request;

    console.log('=== 最終的なプラン構造確認 ===');
    console.log('Trip ID:', modifiedPlan.trip_id);
    console.log('Theme:', modifiedPlan.theme);
    console.log('Hero title:', modifiedPlan.hero?.title);
    console.log('Itinerary days:', modifiedPlan.itinerary?.length);
    console.log('Activities total:', modifiedPlan.itinerary?.reduce((total, day) => total + (day.activities?.length || 0), 0));

    // 最終検証（基本的なもののみ）
    const isValidPlan = (
      modifiedPlan.trip_id &&
      modifiedPlan.theme &&
      modifiedPlan.hero &&
      modifiedPlan.hero.title &&
      Array.isArray(modifiedPlan.itinerary)
    );

    if (!isValidPlan) {
      console.error('=== プラン構造検証失敗 ===');
      console.error('Trip ID:', !!modifiedPlan.trip_id);
      console.error('Theme:', !!modifiedPlan.theme);
      console.error('Hero:', !!modifiedPlan.hero);
      console.error('Hero title:', !!modifiedPlan.hero?.title);
      console.error('Itinerary array:', Array.isArray(modifiedPlan.itinerary));
      
      throw new Error('必須フィールドが不足しています');
    }

    console.log('=== 修正完了 ===');

    return NextResponse.json({
      success: true,
      modified_plan: modifiedPlan,
      original_plan_id: original_plan.trip_id,
      modification_request: modification_request
    });
    
  } catch (error) {
    console.error('=== プラン修正エラー ===', error);
    
    // 詳細なエラーログ
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // エラーレスポンス
    let errorMessage = 'プランの修正に失敗しました';
    let statusCode = 500;

    if (error.message.includes('API key')) {
      errorMessage = 'API設定エラー';
      statusCode = 401;
    } else if (error.message.includes('Rate limit') || error.status === 429) {
      errorMessage = 'リクエスト制限に達しました。しばらく待ってから再試行してください';
      statusCode = 429;
    } else if (error.message.includes('JSON')) {
      errorMessage = 'AIからの応答解析に失敗しました';
    } else if (error.message.includes('OpenAI')) {
      errorMessage = 'AI処理でエラーが発生しました';
    } else if (error.message.includes('必須フィールド')) {
      errorMessage = 'プランデータの生成に失敗しました。再度お試しください';
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}