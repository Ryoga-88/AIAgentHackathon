import { NextResponse } from "next/server";

const GOOGLE_API_KEY = "AIzaSyDHfzBeAhUq5BfZL_uycHSrirgnhBDtnWQ";
const SEARCH_ENGINE_ID = "YOUR_SEARCH_ENGINE_ID"; // 実際のSearch Engine IDに置き換えてください

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: "検索クエリが必要です" },
        { status: 400 }
      );
    }

    // Google Custom Search API エンドポイント
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=1&safe=active`;

    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 最初の画像結果を返す
    if (data.items && data.items.length > 0) {
      const imageUrl = data.items[0].link;
      return NextResponse.json({ imageUrl });
    } else {
      return NextResponse.json({ imageUrl: null });
    }

  } catch (error) {
    console.error("画像検索エラー:", error);
    return NextResponse.json(
      { error: "画像検索に失敗しました", message: error.message },
      { status: 500 }
    );
  }
}