import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK初期化
let adminApp;
let adminDb;

try {
  if (getApps().length === 0) {
    // Firebase Admin SDKの設定
    // 本番環境では環境変数から設定、開発環境では直接設定を使用
    const firebaseAdminConfig = {
      projectId: "hack-63b2d",
      // 本番環境では環境変数から認証情報を取得
      // credential: cert({
      //   projectId: process.env.FIREBASE_PROJECT_ID,
      //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      //   privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      // }),
    };

    adminApp = initializeApp(firebaseAdminConfig);
  } else {
    adminApp = getApps()[0];
  }

  adminDb = getFirestore(adminApp);
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  // Firebase Admin が使用できない場合はnullにする
  adminDb = null;
}

export { adminDb };