#!/usr/bin/env node

/**
 * ホテル検索API テストスクリプト
 * 使用方法: node test-hotel-search.js [オプション]
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 環境変数ファイルを読み込む
function loadEnvFile(filename) {
  try {
    const envFile = readFileSync(filename, 'utf8');
    envFile.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // 引用符を削除
          process.env[key.trim()] = value.trim();
        }
      }
    });
    console.log(`✅ ${filename} を読み込みました`);
    return true;
  } catch (error) {
    return false;
  }
}

// 複数の環境変数ファイルを試す
if (!loadEnvFile('.env.local')) {
  if (!loadEnvFile('.env')) {
    console.warn('⚠️  環境変数ファイルが見つかりません (.env.local または .env)');
    console.log('環境変数を直接設定するか、適切なファイルを配置してください。');
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 楽天API直接テスト用の関数
async function testRakutenAPI(params) {
  const RAKUTEN_APP_ID = process.env.RAKUTEN_APPLICATION_ID;
  
  if (!RAKUTEN_APP_ID) {
    console.error('❌ 楽天アプリケーションIDが設定されていません');
    console.log('環境変数 RAKUTEN_APPLICATION_ID を設定してください');
    return;
  }

  // 楽天APIの基本パラメータ
  const searchParams = new URLSearchParams({
    format: "json",
    applicationId: RAKUTEN_APP_ID,
    checkinDate: params.checkin || "2024-08-01",
    checkoutDate: params.checkout || "2024-08-02", 
    adultNum: params.adults || "2",
    hits: "5"
  });

  // 座標パラメータの処理（楽天APIの仕様に合わせて調整）
  if (params.additional) {
    Object.entries(params.additional).forEach(([key, value]) => {
      if (key === 'latitude' || key === 'longitude') {
        // 座標は小数点以下4桁に制限
        const numValue = parseFloat(value);
        const formattedValue = numValue.toFixed(4);
        searchParams.append(key, formattedValue);
      } else {
        searchParams.append(key, value.toString());
      }
    });
  }

  const searchUrl = "https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426";
  const fullUrl = `${searchUrl}?${searchParams.toString()}`;
  
  console.log('🔍 楽天API直接テスト');
  console.log('URL:', fullUrl);
  console.log('パラメータ:', Object.fromEntries(searchParams));
  console.log('');

  try {
    const response = await fetch(fullUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ APIエラー:', response.status);
      console.error('レスポンス:', JSON.stringify(data, null, 2));
      return;
    }

    if (data.error) {
      console.error('❌ 楽天APIエラー:', data.error_description || data.error);
      return;
    }

    console.log(`✅ 成功! ${data.hotels?.length || 0}件のホテルが見つかりました`);
    
    if (data.hotels && data.hotels.length > 0) {
      console.log('\n📋 ホテル一覧:');
      data.hotels.forEach((hotelData, index) => {
        const hotel = hotelData.hotel[0].hotelBasicInfo;
        console.log(`\n${index + 1}. ${hotel.hotelName}`);
        console.log(`   📍 ${hotel.address1}${hotel.address2 || ''}`);
        console.log(`   💰 ${hotel.hotelMinCharge ? `¥${hotel.hotelMinCharge.toLocaleString()}〜` : '料金要確認'}`);
        console.log(`   ⭐ ${hotel.reviewAverage || 0} (${hotel.reviewCount || 0}件)`);
      });
    }
  } catch (error) {
    console.error('❌ リクエストエラー:', error.message);
  }
}

// Next.js API経由のテスト
async function testNextjsAPI(testType, params) {
  const API_URL = 'http://localhost:3000/api/search-hotels';
  
  console.log(`🔍 Next.js API テスト (${testType})`);
  console.log('URL:', API_URL);
  console.log('パラメータ:', JSON.stringify(params, null, 2));
  console.log('');

  // 開発サーバーが起動しているかチェック
  try {
    const healthCheck = await fetch('http://localhost:3000', { method: 'HEAD' });
  } catch (error) {
    console.error('❌ 開発サーバーが起動していません');
    console.log('先に以下のコマンドで開発サーバーを起動してください:');
    console.log('  npm run dev');
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ APIエラー:', response.status);
      console.error('レスポンス:', JSON.stringify(data, null, 2));
      return;
    }

    console.log(`✅ 成功! ${data.results?.length || 0}件のホテルが見つかりました`);
    console.log('メッセージ:', data.message);
    
    if (data.results && data.results.length > 0) {
      console.log('\n📋 ホテル一覧:');
      data.results.forEach((hotel, index) => {
        console.log(`\n${index + 1}. ${hotel.name}`);
        console.log(`   📍 ${hotel.location}`);
        console.log(`   💰 ${hotel.price}`);
        console.log(`   ⭐ ${hotel.rating} (${hotel.reviewCount}件)`);
      });
    }
  } catch (error) {
    console.error('❌ リクエストエラー:', error.message);
  }
}

// サンプル旅行プランデータ
const sampleItinerary = [
  {
    day: 1,
    date: "2024-08-01",
    activities: [
      {
        title: "清水寺",
        search_query: "清水寺 京都市",
        location: "清水寺"
      }
    ],
    accommodation: "京都市内"
  },
  {
    day: 2,
    date: "2024-08-02", 
    activities: [
      {
        title: "金閣寺",
        search_query: "金閣寺 京都市",
        location: "金閣寺"
      }
    ],
    accommodation: "出発日のため宿泊なし"
  }
];

// メイン実行関数
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'help';

  console.log('🏨 ホテル検索API テストツール\n');

  switch (testType) {
    case 'rakuten':
      // 楽天API直接テスト（座標検索）
      await testRakutenAPI({
        checkin: args[1] || '2024-08-01',
        checkout: args[2] || '2024-08-02',
        adults: args[3] || '2',
        additional: {
          latitude: args[4] || '35.6762',    // 東京駅
          longitude: args[5] || '139.6503',
          searchRadius: '3'
        }
      });
      break;

    case 'location':
      // 地名検索テスト
      await testNextjsAPI('地名検索', {
        checkin: args[1] || '2024-08-01',
        checkout: args[2] || '2024-08-02', 
        adults: parseInt(args[3]) || 2,
        searchType: 'location',
        location: args[4] || '京都'
      });
      break;

    case 'debug':
      // デバッグ：座標検索のみテスト
      console.log('🔍 楽天API 座標検索テスト');
      console.log('環境変数:');
      console.log('  RAKUTEN_APPLICATION_ID:', process.env.RAKUTEN_APPLICATION_ID ? '設定済み' : '未設定');
      
      console.log('\n=== 座標検索（東京駅）===');
      await testRakutenAPI({
        additional: { 
          latitude: '35.6762',
          longitude: '139.6503',
          searchRadius: '3'
        }
      });
      
      console.log('\n=== 座標検索（京都駅）===');
      await testRakutenAPI({
        additional: { 
          latitude: '34.9859',
          longitude: '135.7581',
          searchRadius: '3'
        }
      });
      
      console.log('\n=== 座標検索（大阪駅）===');
      await testRakutenAPI({
        additional: { 
          latitude: '34.7024',
          longitude: '135.4959',
          searchRadius: '3'
        }
      });
      break;

    case 'coordinates':
      // 座標検索テスト
      await testNextjsAPI('座標検索', {
        checkin: args[1] || '2024-08-01',
        checkout: args[2] || '2024-08-02',
        adults: parseInt(args[3]) || 2,
        searchType: 'coordinates',
        coordinates: {
          latitude: parseFloat(args[4]) || 35.6762, // 東京駅
          longitude: parseFloat(args[5]) || 139.6503
        }
      });
      break;

    case 'itinerary':
      // 旅行プラン検索テスト
      await testNextjsAPI('旅行プラン検索', {
        checkin: args[1] || '2024-08-01',
        checkout: args[2] || '2024-08-02',
        adults: parseInt(args[3]) || 2,
        searchType: 'itinerary',
        itinerary: sampleItinerary
      });
      break;

    case 'all':
      // 全パターンテスト
      console.log('🚀 全パターンテスト開始\n');
      
      console.log('=' .repeat(50));
      await testRakutenAPI({
        additional: { keyword: '東京' }
      });
      
      console.log('\n' + '='.repeat(50));
      await testNextjsAPI('地名検索', {
        checkin: '2024-08-01',
        checkout: '2024-08-02',
        adults: 2,
        searchType: 'location', 
        location: '京都'
      });

      console.log('\n' + '='.repeat(50));
      await testNextjsAPI('座標検索', {
        checkin: '2024-08-01',
        checkout: '2024-08-02',
        adults: 2,
        searchType: 'coordinates',
        coordinates: { latitude: 35.6762, longitude: 139.6503 }
      });

      console.log('\n' + '='.repeat(50));
      await testNextjsAPI('旅行プラン検索', {
        checkin: '2024-08-01',
        checkout: '2024-08-02', 
        adults: 2,
        searchType: 'itinerary',
        itinerary: sampleItinerary
      });
      break;

    default:
      // ヘルプ
      console.log(`使用方法:
  node test-hotel-search.js <テストタイプ> [オプション]

テストタイプ:
  rakuten [日付] [日付] [人数] [緯度] [経度]  楽天API直接テスト（座標）
  coordinates [日付] [日付] [人数] [緯度] [経度]  座標検索テスト（Next.js API経由）
  debug                                座標検索デバッグ（複数地点）
  
例:
  node test-hotel-search.js rakuten
  node test-hotel-search.js rakuten 2024-08-01 2024-08-02 2 35.6762 139.6503
  node test-hotel-search.js debug
  node test-hotel-search.js coordinates 2024-08-01 2024-08-02 2 35.6762 139.6503

座標例:
  東京駅: 35.6762, 139.6503
  京都駅: 34.9859, 135.7581  
  大阪駅: 34.7024, 135.4959

環境変数:
  RAKUTEN_APPLICATION_ID  楽天アプリケーションID (必須)
  GOOGLE_MAPS_API_KEY     Google Maps API キー (座標・旅行プラン検索用)
`);
      break;
  }
}

// スクリプト実行
main().catch(console.error);