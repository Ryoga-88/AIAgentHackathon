# Firebase セットアップ手順

## 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `travel-planner-app`）
4. Google Analytics を有効にするか選択
5. プロジェクトを作成

## 2. Firebase Authentication の設定

1. Firebase Console でプロジェクトを選択
2. 左サイドバーから「Authentication」を選択
3. 「始める」をクリック
4. 「Sign-in method」タブで以下を有効化：
   - メール/パスワード
   - Google（オプション）

## 3. Cloud Firestore の設定

1. 左サイドバーから「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. セキュリティルールで「テストモードで開始」を選択
4. ロケーションを選択（asia-northeast1 推奨）

## 4. Web アプリの追加

1. プロジェクト概要から「Web アプリを追加」（</> アイコン）をクリック
2. アプリ名を入力
3. Firebase Hosting は後で設定可能
4. 設定情報をコピー

## 5. 環境変数の設定

`.env.local` ファイルの値を Firebase 設定情報で更新：

```
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

## 6. セキュリティルールの設定（本番前に必須）

Cloud Firestore のルールを以下に更新：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のドキュメントのみアクセス可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // ユーザーの旅行プラン
      match /travelPlans/{planId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 7. Firebase Hosting によるデプロイ（オプション）

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## トラブルシューティング

### API キーエラーが発生する場合
- `.env.local` ファイルが正しく設定されているか確認
- Next.js アプリを再起動（`npm run dev`）
- ブラウザのキャッシュをクリア

### 認証エラーが発生する場合
- Firebase Console で認証方法が有効になっているか確認
- ドメインが承認済みドメインに追加されているか確認（本番時）

### Firestore エラーが発生する場合
- Cloud Firestore が有効になっているか確認
- セキュリティルールが適切に設定されているか確認
