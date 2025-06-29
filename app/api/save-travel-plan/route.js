import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

export async function POST(request) {
  try {
    console.log('🔥 API: プラン保存開始');
    
    const body = await request.json();
    const { uid, planData } = body;
    
    console.log('🔥 API: 受信UID:', uid);
    console.log('🔥 API: 受信データ:', planData);
    
    if (!uid) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }
    
    if (!planData) {
      return NextResponse.json(
        { error: 'プランデータが必要です' },
        { status: 400 }
      );
    }
    
    // Admin SDKが利用可能な場合はそれを使用
    if (adminDb) {
      console.log('🔥 API: Admin SDK使用してFirestore保存');
      const docRef = adminDb.collection('travel_plans').doc(uid);
      await docRef.set({
        ...planData,
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('🔥 API: Admin SDK保存成功');
    } else {
      // Admin SDKが利用できない場合は、クライアント側で保存
      console.log('🔥 API: Admin SDK利用不可、クライアント側保存を推奨');
      return NextResponse.json(
        { message: 'Admin SDK利用不可。クライアント側で保存してください。', fallback: true },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { message: 'プラン保存成功', uid },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('🔥 API: プラン保存エラー:', error);
    return NextResponse.json(
      { error: 'プラン保存に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}