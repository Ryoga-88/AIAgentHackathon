# OpenAI API キー設定手順

## 1. OpenAI アカウントの作成

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. 「Sign up」でアカウント作成、または「Log in」でログイン
3. 電話番号認証を完了

## 2. API キーの取得

1. ログイン後、右上のアカウントメニューから「API keys」を選択
2. 「Create new secret key」をクリック
3. キー名を入力（例: `travel-planner-app`）
4. 生成されたAPIキーをコピー（⚠️ 一度しか表示されません）

## 3. 環境変数の設定

`.env.local` ファイルの `OPENAI_API_KEY` を更新：

```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 4. 課金設定（重要）

OpenAI APIは従量課金制です：

1. [Billing](https://platform.openai.com/account/billing/overview) ページでクレジットカードを登録
2. 月額使用量制限を設定（推奨: $10-20）
3. アラート設定で使いすぎを防止

## 5. API使用量の目安

このアプリでの概算費用：
- GPT-4o mini: ~$0.01-0.05 per 旅行プラン生成
- 月100回生成で約 $1-5

## 6. セキュリティ注意事項

⚠️ **重要**: APIキーは秘密情報です
- GitHubにコミットしない（`.env.local`は.gitignoreに含まれています）
- 他人と共有しない
- 定期的にキーをローテーション

## トラブルシューティング

### エラー: "Invalid API key"
- APIキーが正しくコピーされているか確認
- キーが有効期限内か確認
- 新しいキーを生成して再試行

### エラー: "Rate limit exceeded"
- APIの利用制限に達しています
- 時間をおいて再試行
- 課金設定を確認

### エラー: "Insufficient credits"
- 課金残高が不足しています
- Billingページでクレジットを追加

## API キーなしでの動作

APIキーが設定されていない場合：
- アプリは自動的にモックデータを使用
- 基本的な機能は動作します
- 実際のAI生成は利用できません

開発・テスト段階ではAPIキーなしでも十分機能します。
