"use client";

/**
 * FFmpeg React Hook
 *
 * 提供 FFmpeg 实例的加载、状态管理和错误处理功能。
 * 封装了 FFmpeg 的生命周期管理，适用于 React 组件。
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkFFmpegEnvironment,
  loadFFmpeg,
  type FFmpegLoadState,
  type FFmpegLog,
  type FFmpegProgress,
} from "../ffmpeg";

/**
 * useFFmpeg Hook 返回值
 */
export interface UseFFmpegReturn {
  /** FFmpeg 实例引用，加载完成后可用 */
  ffmpeg: FFmpeg | null;
  /** 当前加载状态 */
  loadState: FFmpegLoadState;
  /** 是否已加载完成 */
  isLoaded: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 当前进度信息（执行命令时） */
  progress: FFmpegProgress | null;
  /** 最新的日志消息 */
  logMessage: string;
  /** 手动加载 FFmpeg */
  load: () => Promise<void>;
  /** 重置状态（用于错误恢复） */
  reset: () => void;
  /** 清理进度数据 */
  clearProgress: () => void;
  /** 环境检查结果 */
  environmentCheck: ReturnType<typeof checkFFmpegEnvironment> | null;
}

/**
 * useFFmpeg Hook 配置选项
 */
export interface UseFFmpegOptions {
  /** 是否在组件挂载时自动加载 FFmpeg，默认 false */
  autoLoad?: boolean;
  /** 日志回调 */
  onLog?: (log: FFmpegLog) => void;
  /** 进度回调 */
  onProgress?: (progress: FFmpegProgress) => void;
  /** 加载完成回调 */
  onLoaded?: () => void;
  /** 加载错误回调 */
  onError?: (error: Error) => void;
}

/**
 * FFmpeg React Hook
 *
 * 管理 FFmpeg 实例的加载和状态，提供响应式的状态更新。
 *
 * @param options - Hook 配置选项
 * @returns UseFFmpegReturn
 *
 * @example
 * ```tsx
 * function VideoCompressor() {
 *   const { ffmpeg, isLoaded, isLoading, load, loadState } = useFFmpeg();
 *
 *   if (!isLoaded) {
 *     return (
 *       <button onClick={load} disabled={isLoading}>
 *         {isLoading ? '加载中...' : '加载 FFmpeg'}
 *       </button>
 *     );
 *   }
 *
 *   return <div>FFmpeg 已就绪</div>;
 * }
 * ```
 */
export function useFFmpeg(options: UseFFmpegOptions = {}): UseFFmpegReturn {
  const { autoLoad = false, onLog, onProgress, onLoaded, onError } = options;

  // FFmpeg 实例引用
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // 状态管理
  const [loadState, setLoadState] = useState<FFmpegLoadState>({
    status: "idle",
  });
  const [progress, setProgress] = useState<FFmpegProgress | null>(null);
  const [logMessage, setLogMessage] = useState<string>("");
  const [environmentCheck, setEnvironmentCheck] = useState<ReturnType<
    typeof checkFFmpegEnvironment
  > | null>(null);

  // 派生状态
  const isLoaded = loadState.status === "ready";
  const isLoading = loadState.status === "loading";

  /**
   * 初始化 FFmpeg 实例并设置事件监听
   */
  const initFFmpegInstance = useCallback(() => {
    if (ffmpegRef.current) {
      return ffmpegRef.current;
    }

    const ffmpeg = new FFmpeg();

    // 设置日志监听
    ffmpeg.on("log", ({ type, message }) => {
      setLogMessage(message);
      onLog?.({ type, message });
    });

    // 设置进度监听
    ffmpeg.on("progress", ({ progress, time }) => {
      const progressData = { progress, time };
      setProgress(progressData);
      onProgress?.(progressData);
    });

    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  }, [onLog, onProgress]);

  /**
   * 加载 FFmpeg
   */
  const load = useCallback(async () => {
    // 检查环境
    const envCheck = checkFFmpegEnvironment();
    setEnvironmentCheck(envCheck);

    if (!envCheck.supported) {
      const error = new Error(envCheck.message);
      setLoadState({ status: "error", error });
      onError?.(error);
      return;
    }

    // 如果已加载，跳过
    if (loadState.status === "ready") {
      return;
    }

    // 如果正在加载，跳过
    if (loadState.status === "loading") {
      return;
    }

    setLoadState({ status: "loading", message: "正在初始化..." });

    try {
      const ffmpeg = initFFmpegInstance();

      await loadFFmpeg(ffmpeg, (message) => {
        setLoadState({ status: "loading", message });
      });

      setLoadState({ status: "ready" });
      onLoaded?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setLoadState({ status: "error", error: err });
      onError?.(err);
    }
  }, [loadState.status, initFFmpegInstance, onLoaded, onError]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    // 清理现有实例
    if (ffmpegRef.current) {
      ffmpegRef.current.terminate();
      ffmpegRef.current = null;
    }

    setLoadState({ status: "idle" });
    setProgress(null);
    setLogMessage("");
    setEnvironmentCheck(null);
  }, []);

  /**
   * 清理进度数据(压缩完成后调用)
   */
  const clearProgress = useCallback(() => {
    setProgress(null);
  }, []);

  // 自动加载
  useEffect(() => {
    if (autoLoad && loadState.status === "idle") {
      load();
    }
  }, [autoLoad, loadState.status, load]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (ffmpegRef.current) {
        ffmpegRef.current.terminate();
      }
    };
  }, []);

  return {
    ffmpeg: ffmpegRef.current,
    loadState,
    isLoaded,
    isLoading,
    progress,
    logMessage,
    load,
    reset,
    clearProgress,
    environmentCheck,
  };
}

export default useFFmpeg;
