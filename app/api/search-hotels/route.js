import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { checkin, checkout, adults, searchType, coordinates, location } = body;

    // 基本的なバリデーション
    if (!checkin || !checkout || !adults) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    if (searchType === 'coordinates' && !coordinates) {
      return NextResponse.json(
        { error: "座標検索には座標情報が必要です" },
        { status: 400 }
      );
    }

    if (searchType === 'location' && !location) {
      return NextResponse.json(
        { error: "地名検索には地名が必要です" },
        { status: 400 }
      );
    }

    // モックホテルデータ（実際のAPIが利用できない場合）
    const mockHotels = [
      {
        id: "hotel_001",
        name: "グランドホテル東京",
        location: "東京都千代田区",
        price: "¥15,000 /泊",
        rating: 4.5,
        reviewCount: 1250,
        image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop",
        url: "https://example.com/hotel1",
        amenities: ["WiFi", "朝食付き", "駐車場"]
      },
      {
        id: "hotel_002", 
        name: "ビジネスホテル中央",
        location: "東京都中央区",
        price: "¥8,000 /泊",
        rating: 4.2,
        reviewCount: 890,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
        url: "https://example.com/hotel2",
        amenities: ["WiFi", "24時間フロント"]
      },
      {
        id: "hotel_003",
        name: "リゾートホテル湾岸",
        location: "東京都江東区",
        price: "¥22,000 /泊", 
        rating: 4.8,
        reviewCount: 654,
        image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop",
        url: "https://example.com/hotel3",
        amenities: ["WiFi", "プール", "スパ", "朝食付き"]
      }
    ];

    // 簡単な地域フィルタリング（実際のAPIでは座標ベースで検索）
    let filteredHotels = mockHotels;
    
    if (searchType === 'location' && location) {
      // 地名に基づく簡単なフィルタリング
      filteredHotels = mockHotels.filter(hotel => 
        hotel.location.includes(location) || 
        hotel.name.includes(location)
      );
    }

    return NextResponse.json({
      results: filteredHotels,
      searchParams: {
        checkin,
        checkout,
        adults,
        searchType,
        coordinates: coordinates || null,
        location: location || null
      },
      message: "モックデータを返しています。実際のホテル検索APIと接続してください。"
    });

  } catch (error) {
    console.error("ホテル検索エラー:", error);
    return NextResponse.json(
      { error: "ホテル検索に失敗しました", message: error.message },
      { status: 500 }
    );
  }
}