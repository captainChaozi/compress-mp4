/**
 * FFmpeg 模块导出
 *
 * 统一导出 FFmpeg 相关的工具函数和 Hooks
 */

// 核心工具函数
export {
  checkFFmpegEnvironment,
  isCrossOriginIsolated,
  isSharedArrayBufferSupported,
  loadFFmpeg,
  type FFmpegLoadState,
  type FFmpegLog,
  type FFmpegProgress,
} from "../ffmpeg";

// React Hooks
export {
  useFFmpeg,
  type UseFFmpegOptions,
  type UseFFmpegReturn,
} from "../hooks/useFFmpeg";
