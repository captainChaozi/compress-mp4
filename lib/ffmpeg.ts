/**
 * FFmpeg.wasm 加载与初始化工具
 *
 * 提供 FFmpeg 实例的加载、初始化和状态管理功能。
 * 优先使用多线程版本 (@ffmpeg/core-mt)，如果不支持则回退到单线程版本。
 *
 * @see https://github.com/ffmpegwasm/ffmpeg.wasm
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

/** FFmpeg 核心版本，与 @ffmpeg/ffmpeg 0.12.x 兼容 */
const FFMPEG_CORE_VERSION = "0.12.10";

/** CDN 基础 URL - 多线程版本 */
const FFMPEG_CORE_MT_BASE_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@${FFMPEG_CORE_VERSION}/dist/umd`;

/** CDN 基础 URL - 单线程版本 (fallback) */
const FFMPEG_CORE_ST_BASE_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;

/** 备用 CDN URL (unpkg) - 多线程 */
const FFMPEG_CORE_MT_FALLBACK = `https://unpkg.com/@ffmpeg/core-mt@${FFMPEG_CORE_VERSION}/dist/umd`;

/** 备用 CDN URL (unpkg) - 单线程 */
const FFMPEG_CORE_ST_FALLBACK = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;

/** 加载超时时间 (ms) */
const LOAD_TIMEOUT = 30000;

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
 * 检查浏览器是否支持 SharedArrayBuffer
 */
export function isSharedArrayBufferSupported(): boolean {
  return typeof SharedArrayBuffer !== "undefined";
}

/**
 * 检查浏览器是否处于跨域隔离状态
 */
export function isCrossOriginIsolated(): boolean {
  return typeof crossOriginIsolated !== "undefined" && crossOriginIsolated;
}

/**
 * 尝试从指定 CDN 加载 FFmpeg (多线程版本)
 */
async function tryLoadMultiThread(
  ffmpeg: FFmpeg,
  baseURL: string,
  onProgress?: (message: string) => void,
): Promise<void> {
  onProgress?.("正在加载核心文件...");
  const coreURL = await toBlobURL(
    `${baseURL}/ffmpeg-core.js`,
    "text/javascript",
  );

  onProgress?.("正在加载 WASM 模块...");
  const wasmURL = await toBlobURL(
    `${baseURL}/ffmpeg-core.wasm`,
    "application/wasm",
  );

  onProgress?.("正在加载 Worker...");
  const workerURL = await toBlobURL(
    `${baseURL}/ffmpeg-core.worker.js`,
    "text/javascript",
  );

  onProgress?.("正在初始化 FFmpeg...");
  await ffmpeg.load({ coreURL, wasmURL, workerURL });
}

/**
 * 尝试从指定 CDN 加载 FFmpeg (单线程版本)
 */
async function tryLoadSingleThread(
  ffmpeg: FFmpeg,
  baseURL: string,
  onProgress?: (message: string) => void,
): Promise<void> {
  onProgress?.("正在加载核心文件...");
  const coreURL = await toBlobURL(
    `${baseURL}/ffmpeg-core.js`,
    "text/javascript",
  );

  onProgress?.("正在加载 WASM 模块...");
  const wasmURL = await toBlobURL(
    `${baseURL}/ffmpeg-core.wasm`,
    "application/wasm",
  );

  onProgress?.("正在初始化 FFmpeg...");
  // 单线程版本不需要 workerURL
  await ffmpeg.load({ coreURL, wasmURL });
}

/**
 * 带超时的 Promise 包装器
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * 加载 FFmpeg 实例
 *
 * 加载策略：
 * 1. 如果浏览器支持 SharedArrayBuffer 和 crossOriginIsolated，尝试多线程版本
 * 2. 如果多线程版本失败或浏览器不支持，回退到单线程版本
 * 3. 每种版本都会尝试主 CDN 和备用 CDN
 * 4. 所有加载都有超时限制
 */
export async function loadFFmpeg(
  ffmpeg: FFmpeg,
  onProgress?: (message: string) => void,
): Promise<void> {
  onProgress?.("正在加载 FFmpeg 核心文件...");

  // 检查是否支持多线程
  const canUseMultiThread =
    isSharedArrayBufferSupported() && isCrossOriginIsolated();

  if (canUseMultiThread) {
    // 尝试多线程版本 - 主 CDN
    try {
      console.log("[FFmpeg] 尝试加载多线程版本 (jsdelivr)...");
      await withTimeout(
        tryLoadMultiThread(ffmpeg, FFMPEG_CORE_MT_BASE_URL, onProgress),
        LOAD_TIMEOUT,
        `加载超时 (${LOAD_TIMEOUT / 1000}s)`,
      );
      onProgress?.("FFmpeg 加载完成 (多线程模式)");
      console.log("[FFmpeg] 多线程版本加载成功");
      return;
    } catch (mtError) {
      console.warn("[FFmpeg] 多线程版本加载失败:", mtError);
    }

    // 尝试多线程版本 - 备用 CDN
    try {
      console.log("[FFmpeg] 尝试多线程备用 CDN (unpkg)...");
      onProgress?.("尝试备用源...");
      await withTimeout(
        tryLoadMultiThread(ffmpeg, FFMPEG_CORE_MT_FALLBACK, onProgress),
        LOAD_TIMEOUT,
        `加载超时 (${LOAD_TIMEOUT / 1000}s)`,
      );
      onProgress?.("FFmpeg 加载完成 (多线程模式)");
      console.log("[FFmpeg] 多线程版本加载成功 (unpkg)");
      return;
    } catch (mtFallbackError) {
      console.warn("[FFmpeg] 多线程备用 CDN 也失败:", mtFallbackError);
    }
  } else {
    console.log("[FFmpeg] 浏览器不支持多线程，直接使用单线程版本");
  }

  // 回退到单线程版本
  onProgress?.("正在加载兼容模式...");

  // 尝试单线程版本 - 主 CDN
  try {
    console.log("[FFmpeg] 尝试单线程版本 (jsdelivr)...");
    await withTimeout(
      tryLoadSingleThread(ffmpeg, FFMPEG_CORE_ST_BASE_URL, onProgress),
      LOAD_TIMEOUT,
      `加载超时 (${LOAD_TIMEOUT / 1000}s)`,
    );
    onProgress?.("FFmpeg 加载完成 (兼容模式)");
    console.log("[FFmpeg] 单线程版本加载成功");
    return;
  } catch (stError) {
    console.warn("[FFmpeg] 单线程版本加载失败:", stError);
  }

  // 尝试单线程版本 - 备用 CDN
  try {
    console.log("[FFmpeg] 尝试单线程备用 CDN (unpkg)...");
    onProgress?.("尝试备用源...");
    await withTimeout(
      tryLoadSingleThread(ffmpeg, FFMPEG_CORE_ST_FALLBACK, onProgress),
      LOAD_TIMEOUT,
      `加载超时 (${LOAD_TIMEOUT / 1000}s)`,
    );
    onProgress?.("FFmpeg 加载完成 (兼容模式)");
    console.log("[FFmpeg] 单线程版本加载成功 (unpkg)");
    return;
  } catch (stFallbackError) {
    console.error("[FFmpeg] 所有加载方式都失败:", stFallbackError);
    throw new Error("FFmpeg 初始化失败。请检查网络连接或尝试使用其他浏览器。");
  }
}

/**
 * 获取 FFmpeg 环境检查结果
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
