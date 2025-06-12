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

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      console.warn("RapidAPI key not found, falling back to mock data");
      return getMockHotelData(searchType, coordinates, location, checkin, checkout, adults);
    }

    try {
      // Booking.com API経由でホテル検索
      let searchUrl;
      let searchParams = new URLSearchParams({
        checkin_date: checkin,
        checkout_date: checkout,
        adults_number: adults.toString(),
        room_number: '1',
        units: 'metric',
        locale: 'ja'
      });

      if (searchType === 'coordinates' && coordinates) {
        searchParams.append('latitude', coordinates.lat.toString());
        searchParams.append('longitude', coordinates.lng.toString());
        searchUrl = `https://booking-com.p.rapidapi.com/v1/hotels/search-by-coordinates?${searchParams}`;
      } else if (searchType === 'location' && location) {
        // まず地名から地域IDを取得
        const locationResponse = await fetch(
          `https://booking-com.p.rapidapi.com/v1/hotels/locations?name=${encodeURIComponent(location)}&locale=ja`,
          {
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
            }
          }
        );

        if (!locationResponse.ok) {
          throw new Error(`Location search failed: ${locationResponse.status}`);
        }

        const locationData = await locationResponse.json();
        if (!locationData || locationData.length === 0) {
          throw new Error('No locations found for the given search term');
        }

        const destId = locationData[0].dest_id;
        const destType = locationData[0].dest_type;
        
        searchParams.append('dest_id', destId.toString());
        searchParams.append('dest_type', destType);
        searchUrl = `https://booking-com.p.rapidapi.com/v1/hotels/search?${searchParams}`;
      } else {
        throw new Error('Invalid search type or missing parameters');
      }

      console.log('ホテル検索URL:', searchUrl);

      const response = await fetch(searchUrl, {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error(`Hotel search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('ホテル検索レスポンス:', data);

      // レスポンスを標準化
      const hotels = (data.result || []).slice(0, 6).map(hotel => ({
        id: hotel.hotel_id?.toString() || Math.random().toString(),
        name: hotel.hotel_name || 'ホテル名不明',
        location: hotel.address || hotel.city || '住所不明',
        price: hotel.min_total_price ? `¥${Math.round(hotel.min_total_price * 110)} /泊` : '料金要確認',
        rating: hotel.review_score || 0,
        reviewCount: hotel.review_nr || 0,
        image: hotel.main_photo_url || 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop',
        url: hotel.url || `https://www.booking.com/hotel/jp/${hotel.hotel_name_trans || hotel.hotel_id}.html`,
        amenities: hotel.facilities ? hotel.facilities.slice(0, 3) : ['WiFi', '24時間フロント']
      }));

      return NextResponse.json({
        results: hotels,
        searchParams: {
          checkin,
          checkout,
          adults,
          searchType,
          coordinates: coordinates || null,
          location: location || null
        },
        message: hotels.length > 0 ? "ホテルを正常に取得しました" : "該当するホテルが見つかりませんでした"
      });

    } catch (apiError) {
      console.error("Hotel API error:", apiError);
      console.log("Falling back to mock data due to API error");
      return getMockHotelData(searchType, coordinates, location, checkin, checkout, adults);
    }

  } catch (error) {
    console.error("ホテル検索エラー:", error);
    return NextResponse.json(
      { error: "ホテル検索に失敗しました", message: error.message },
      { status: 500 }
    );
  }
}

function getMockHotelData(searchType, coordinates, location, checkin, checkout, adults) {
  // モックホテルデータ（APIが利用できない場合）
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
}