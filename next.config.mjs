/** @type {import('next').NextConfig} */
const nextConfig = {
  // ビルドの最適化
  swcMinify: true,
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
