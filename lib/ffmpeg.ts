/**
 * FFmpeg.wasm 加载与初始化工具
 *
 * 提供 FFmpeg 实例的加载、初始化和状态管理功能。
 * 使用多线程版本 (@ffmpeg/core-mt) 以获得更好的性能。
 *
 * @see https://github.com/ffmpegwasm/ffmpeg.wasm
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

/** FFmpeg 多线程核心版本，与 @ffmpeg/ffmpeg 0.12.x 兼容 */
const FFMPEG_CORE_VERSION = "0.12.10";

/**
 * CDN 基础 URL
 * 使用 UMD 版本（非 ESM），这是 ffmpeg.wasm 文档推荐的方式
 * UMD 版本不依赖 ES 模块动态 import，与各种打包器兼容性更好
 */
const FFMPEG_CORE_BASE_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@${FFMPEG_CORE_VERSION}/dist/umd`;

/** 备用 CDN URL (unpkg) */
const FFMPEG_CORE_BASE_URL_FALLBACK = `https://unpkg.com/@ffmpeg/core-mt@${FFMPEG_CORE_VERSION}/dist/umd`;

/**
 * FFmpeg 加载状态
 */
export type FFmpegLoadState =
  | { status: "idle" }
  | { status: "loading"; message?: string }
  | { status: "ready" }
  | { status: "error"; error: Error };

/**
 * FFmpeg 进度回调参数
 */
export interface FFmpegProgress {
  /** 进度百分比 0-1 */
  progress: number;
  /** 已处理的时间戳（秒） */
  time: number;
}

/**
 * FFmpeg 日志回调参数
 */
export interface FFmpegLog {
  /** 日志类型 */
  type: string;
  /** 日志消息 */
  message: string;
}

/**
 * 尝试从指定 CDN 加载 FFmpeg
 */
async function tryLoadFromCDN(
  ffmpeg: FFmpeg,
  baseURL: string,
  onProgress?: (message: string) => void,
): Promise<void> {
  onProgress?.(`正在从 CDN 加载核心文件...`);

  const coreURL = await toBlobURL(
    `${baseURL}/ffmpeg-core.js`,
    "text/javascript",
  );

  onProgress?.(`正在加载 WASM 模块...`);
  const wasmURL = await toBlobURL(
    `${baseURL}/ffmpeg-core.wasm`,
    "application/wasm",
  );

  onProgress?.(`正在加载 Worker...`);
  const workerURL = await toBlobURL(
    `${baseURL}/ffmpeg-core.worker.js`,
    "text/javascript",
  );

  onProgress?.(`正在初始化 FFmpeg...`);
  await ffmpeg.load({ coreURL, wasmURL, workerURL });
}

/**
 * 加载 FFmpeg 实例
 *
 * 从 CDN 加载 FFmpeg WASM 核心文件并初始化。
 * 使用 toBlobURL 转换 URL 以绑定正确的 MIME 类型，避免 CORS 问题。
 * 如果主 CDN 失败，会尝试备用 CDN。
 *
 * @param ffmpeg - FFmpeg 实例
 * @param onProgress - 可选的加载进度回调
 * @returns Promise<void>
 * @throws Error 如果加载失败
 *
 * @example
 * ```typescript
 * const ffmpeg = new FFmpeg();
 * await loadFFmpeg(ffmpeg);
 * ```
 */
export async function loadFFmpeg(
  ffmpeg: FFmpeg,
  onProgress?: (message: string) => void,
): Promise<void> {
  onProgress?.("正在加载 FFmpeg 核心文件...");

  // 尝试主 CDN
  try {
    console.log("[FFmpeg] 尝试从 jsdelivr 加载...");
    await tryLoadFromCDN(ffmpeg, FFMPEG_CORE_BASE_URL, onProgress);
    onProgress?.("FFmpeg 加载完成");
    console.log("[FFmpeg] 加载成功 (jsdelivr)");
    return;
  } catch (primaryError) {
    console.warn("[FFmpeg] jsdelivr 加载失败:", primaryError);
  }

  // 尝试备用 CDN
  try {
    console.log("[FFmpeg] 尝试从 unpkg 加载...");
    onProgress?.("主 CDN 失败，尝试备用源...");
    await tryLoadFromCDN(ffmpeg, FFMPEG_CORE_BASE_URL_FALLBACK, onProgress);
    onProgress?.("FFmpeg 加载完成");
    console.log("[FFmpeg] 加载成功 (unpkg)");
    return;
  } catch (fallbackError) {
    console.error("[FFmpeg] unpkg 加载也失败:", fallbackError);
    const message =
      fallbackError instanceof Error
        ? fallbackError.message
        : "FFmpeg 加载失败";
    throw new Error(
      `FFmpeg 初始化失败: ${message}。请检查网络连接或尝试使用 VPN。`,
    );
  }
}

/**
 * 检查浏览器是否支持 SharedArrayBuffer
 *
 * SharedArrayBuffer 是 FFmpeg 多线程模式的必要条件。
 * 需要正确配置 COOP/COEP 响应头才能启用。
 *
 * @returns boolean 是否支持 SharedArrayBuffer
 */
export function isSharedArrayBufferSupported(): boolean {
  return typeof SharedArrayBuffer !== "undefined";
}

/**
 * 检查浏览器是否处于跨域隔离状态
 *
 * @returns boolean 是否处于跨域隔离状态
 */
export function isCrossOriginIsolated(): boolean {
  return typeof crossOriginIsolated !== "undefined" && crossOriginIsolated;
}

/**
 * 获取 FFmpeg 环境检查结果
 *
 * @returns 环境检查结果对象
 */
export function checkFFmpegEnvironment(): {
  sharedArrayBuffer: boolean;
  crossOriginIsolated: boolean;
  supported: boolean;
  message: string;
} {
  const sharedArrayBuffer = isSharedArrayBufferSupported();
  const crossOrigin = isCrossOriginIsolated();
  const supported = sharedArrayBuffer && crossOrigin;

  let message: string;
  if (supported) {
    message = "环境检查通过，支持多线程模式";
  } else if (!crossOrigin) {
    message = "未启用跨域隔离，请检查 COOP/COEP 响应头配置";
  } else if (!sharedArrayBuffer) {
    message = "浏览器不支持 SharedArrayBuffer";
  } else {
    message = "环境检查失败";
  }

  return {
    sharedArrayBuffer,
    crossOriginIsolated: crossOrigin,
    supported,
    message,
  };
}
