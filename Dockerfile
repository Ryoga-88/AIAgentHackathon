# Next.js Dockerfile
FROM node:18-alpine

WORKDIR /app

# 必要なパッケージをインストール
RUN apk add --no-cache libc6-compat

# 依存関係をコピーしてインストール
COPY package*.json ./
RUN npm ci

# アプリケーションコードをコピー
COPY . .

# Next.jsアプリをビルド
RUN npm run build

# ポート設定
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# アプリケーション開始
CMD ["npm", "start"]