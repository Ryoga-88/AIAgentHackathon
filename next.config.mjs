/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker用のスタンドアロンビルド
  output: 'standalone',
  // 不要なファイルの除外
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
