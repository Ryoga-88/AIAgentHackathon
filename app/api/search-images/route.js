import { NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

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

    // Google Search Engine IDが設定されていない場合は、Unsplashの代替画像を使用
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID || SEARCH_ENGINE_ID === "YOUR_SEARCH_ENGINE_ID") {
      console.log("Google Search API未設定のため、Unsplashを使用します");
      
      // Unsplash APIを使用して代替画像を取得
      const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
      
      return NextResponse.json({ 
        imageUrl: unsplashUrl,
        source: "unsplash" 
      });
    }

    // Google Custom Search API エンドポイント
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=1&safe=active`;

    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.error(`Google API error: ${response.status}`);
      // エラー時もUnsplashにフォールバック
      const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
      return NextResponse.json({ 
        imageUrl: unsplashUrl,
        source: "unsplash_fallback" 
      });
    }

    const data = await response.json();
    
    // 最初の画像結果を返す
    if (data.items && data.items.length > 0) {
      const imageUrl = data.items[0].link;
      return NextResponse.json({ 
        imageUrl,
        source: "google" 
      });
    } else {
      // 結果がない場合もUnsplashにフォールバック
      const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
      return NextResponse.json({ 
        imageUrl: unsplashUrl,
        source: "unsplash_fallback" 
      });
    }

  } catch (error) {
    console.error("画像検索エラー:", error);
    
    // エラー時もUnsplashにフォールバック
    const query = new URL(request.url).searchParams.get('q');
    const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(query || 'travel')}`;
    
    return NextResponse.json({ 
      imageUrl: unsplashUrl,
      source: "unsplash_error_fallback" 
    });
  }
}