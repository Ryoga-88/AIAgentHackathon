import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

export async function GET(request) {
  try {
    console.log('🔥 API: プラン取得開始');
    
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    
    console.log('🔥 API: 取得UID:', uid);
    
    if (!uid) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }
    
    // Admin SDKが利用可能な場合はそれを使用
    if (adminDb) {
      console.log('🔥 API: Admin SDK使用してFirestore取得');
      const docRef = adminDb.collection('travel_plans').doc(uid);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        console.log('🔥 API: ドキュメントが存在しません');
        return NextResponse.json(
          { error: 'プランが見つかりません' },
          { status: 404 }
        );
      }
      
      const planData = doc.data();
      console.log('🔥 API: Admin SDK取得成功');
      
      return NextResponse.json(
        { success: true, data: planData },
        { status: 200 }
      );
    } else {
      // Admin SDKが利用できない場合は、クライアント側で取得
      console.log('🔥 API: Admin SDK利用不可、クライアント側取得を推奨');
      return NextResponse.json(
        { message: 'Admin SDK利用不可。クライアント側で取得してください。', fallback: true },
        { status: 200 }
      );
    }
    
  } catch (error) {
    console.error('🔥 API: プラン取得エラー:', error);
    return NextResponse.json(
      { error: 'プラン取得に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}