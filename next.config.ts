import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 配置 Cross-Origin Isolation 响应头
   * 启用 SharedArrayBuffer 以支持 FFmpeg.wasm 多线程模式
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },

  /**
   * Webpack 配置
   *
   * 解决 ffmpeg.wasm 的模块解析问题
   */
  webpack: (config, { isServer }) => {
    // 禁止 webpack 对 ffmpeg 相关模块进行打包处理
    // 这些模块需要在运行时动态加载
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
