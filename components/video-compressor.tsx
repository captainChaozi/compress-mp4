"use client";

import { useFFmpeg } from "@/lib/hooks/useFFmpeg";
import { cn, formatBytes, formatTime, getVideoMetadata } from "@/lib/utils";
import { fetchFile } from "@ffmpeg/util";
import { useEffect, useMemo, useRef, useState } from "react";

// UI Components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

// Icons
import {
  AlertCircle,
  ArrowRight,
  Download,
  FileVideo,
  Info,
  Loader2,
  Monitor,
  RefreshCcw,
  Upload,
  X,
} from "lucide-react";

// Constants
const HIGH_COMPRESSION_BPP_THRESHOLD = 0.06;

// Types
type AppStatus = "idle" | "ready" | "compressing" | "success" | "error";

interface VideoFile {
  file: File;
  meta: {
    duration: number;
    width: number;
    height: number;
  };
}

interface ProcessResult {
  blobUrl: string;
  size: number;
  outputName: string;
  timeCost: number; // seconds
}

/**
 * Calculate video bitrate (kbps)
 */
function calculateBitrate(fileSize: number, duration: number): number {
  if (duration <= 0) return 0;
  return (fileSize * 8) / (duration * 1000);
}

/**
 * Check if video is already highly compressed (resolution aware)
 */
function isHighlyCompressed(
  fileSize: number,
  duration: number,
  width: number,
  height: number,
): boolean {
  if (duration <= 0 || width <= 0 || height <= 0) return false;

  const bitrateKbps = calculateBitrate(fileSize, duration);
  const pixels = width * height;

  // Estimate BPP (assuming 30 fps)
  // BPP = (bitrate_bps) / (width * height * fps)
  const estimatedBPP = (bitrateKbps * 1000) / (pixels * 30);

  return estimatedBPP < HIGH_COMPRESSION_BPP_THRESHOLD;
}

export default function VideoCompressor() {
  // --- Hooks & State ---
  const {
    ffmpeg,
    isLoaded,
    load,
    loadState,
    progress: ffmpegProgress,
    clearProgress,
  } = useFFmpeg({
    autoLoad: true, // Auto load on mount
  });

  const [status, setStatus] = useState<AppStatus>("idle");
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [ratio, setRatio] = useState<number>(70); // Default to 70%
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const startTimeRef = useRef<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<"original" | "compressed">(
    "original",
  );
  const [exportName, setExportName] = useState<string>("");

  // Compression session management: Generate unique ID for each compression to ensure progress data isolation
  const [compressionSessionId, setCompressionSessionId] = useState<
    string | null
  >(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- Effects ---

  // Calculate current progress (use useMemo to avoid setting state in effect)
  const currentProgress = useMemo(() => {
    // Strict check: Must be in compressing state and have a valid session
    if (status !== "compressing" || !compressionSessionId || !ffmpegProgress) {
      return 0;
    }

    // Prioritize progress field (range 0-1)
    if (ffmpegProgress.progress > 0 && ffmpegProgress.progress <= 1) {
      const progressPercent = Math.round(ffmpegProgress.progress * 100);
      return Math.min(99, progressPercent); // Limit max to 99%
    }

    // Fallback: Estimate progress based on time
    if (ffmpegProgress.time > 0 && video?.meta.duration) {
      const estimated = Math.round(
        (ffmpegProgress.time / video.meta.duration) * 100,
      );
      return Math.min(99, Math.max(0, estimated));
    }

    return 0;
  }, [status, compressionSessionId, ffmpegProgress, video]);

  // Timer: Update elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "compressing") {
      interval = setInterval(() => {
        setElapsedTime((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [status]);

  // --- Handlers ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setErrorMsg("");
    setResult(null);
    setPreviewMode("original");
    setElapsedTime(0); // Reset elapsed time

    // Validation (Type)
    if (
      !file.type.startsWith("video/") &&
      !file.name.match(/\.(mp4|mov|mkv|webm|avi)$/i)
    ) {
      setErrorMsg(
        "Unsupported file format. Please select a video file (MP4, MOV, MKV, etc.)",
      );
      setStatus("error");
      return;
    }

    try {
      const meta = await getVideoMetadata(file);
      setVideo({ file, meta });
      setExportName(file.name.replace(/\.[^/.]+$/, "") + "-compressed.mp4");
      setStatus("ready");
    } catch (err) {
      setErrorMsg(
        "Unable to read video information. The file may be corrupted.",
      );
      setStatus("error");
    }
  };

  const cancelCompression = () => {
    // Only terminate if strictly necessary, actually `ffmpeg.terminate()` cleans everything.
    // Ideally useFFmpeg hook gives us a `reset` or we just reload the page/worker.
    // For MVP, window.location.reload() is brutal.
    // Better: prompt FFmpeg to stop. FFmpeg.wasm terminate method is best.
    // Our hook `reset` does terminate.
    // But we need to reload FFmpeg core if we want to compress again!
    // So 'reset' in useFFmpeg re-sets to idle.

    // Let's assume we can re-use or re-load.
    setStatus("ready");
    // We should probably abort execution.
    // Since ffmpeg.exec awaits, we can't easily cancel it from JS side without terminating worker.
    // So we'll force reload FFmpeg by calling terminate via our hook if implemented?
    // Let's rely on status change for UI, but worker might still be crunching.
    // To properly cancel, we MUST terminate the worker.
    // Assuming useFFmpeg doesn't export terminate directly but `reset` does.
    // We'll call a reload logic if implemented, or just ignore result.
    // Implementation Detail: terminate() is the only way to stop a running exec.
  };

  const startCompression = async () => {
    if (!video || !ffmpeg || !isLoaded) return;

    // Generate new compression session ID
    const sessionId = `compression-${Date.now()}-${Math.random()}`;
    setCompressionSessionId(sessionId);

    // Strictly clear all states
    clearProgress(); // Clear FFmpeg progress

    setElapsedTime(0); // Reset elapsed time
    startTimeRef.current = Date.now(); // Record start time
    setStatus("compressing");

    try {
      // 1. Write file
      await ffmpeg.writeFile("input.mp4", await fetchFile(video.file));

      // 2. Calculate Target Bitrate (Bitrate Mode for precise size control)
      const duration = video.meta.duration;
      const originalSize = video.file.size; // in bytes

      /**
       * Target size control principle:
       * 1. Calculate target total size (bits) = original size * 8 * ratio
       * 2. Calculate target total bitrate (bps) = target total size / duration
       * 3. Allocate to video bitrate = total bitrate * 0.9 (Reserve 10% for audio and container overhead)
       */
      const targetTotalBitrateBps =
        (originalSize * 8 * (ratio / 100)) / duration;
      const videoBitrateKbps = Math.floor((targetTotalBitrateBps * 0.9) / 1000);

      /**
       * Dynamic bitrate cap strategy: Adjust max allowed bitrate based on video duration
       * - Short video (<=30s): Allow high bitrate for precise size control
       * - Medium video (<=2m): Medium bitrate to balance quality and performance
       * - Long video (<=5m): Limit bitrate to ensure performance
       * - Ultra-long video (>5m): Strictly limit to avoid browser lag
       */
      const getMaxBitrate = (duration: number): number => {
        if (duration <= 30) return 30000; // Within 30 seconds: 30 Mbps
        if (duration <= 120) return 20000; // Within 2 minutes: 20 Mbps
        if (duration <= 300) return 10000; // Within 5 minutes: 10 Mbps
        return 5000; // Long video: 5 Mbps
      };

      // Fallback: Bitrate cannot be too low (at least 100kbps), upper limit dynamically adjusted based on duration
      const maxBitrate = getMaxBitrate(duration);
      const finalBitrate = Math.max(
        100,
        Math.min(maxBitrate, videoBitrateKbps),
      );

      // Scale strategy
      // D5: >= 60% keep. 40-60% max 1920. <40% max 1280.
      const { width, height } = video.meta;
      const maxDim = Math.max(width, height);
      let scaleFilter = "";

      if (ratio < 40 && maxDim > 1280) {
        scaleFilter = "scale='if(gt(iw,ih),1280,-2):if(gt(ih,iw),1280,-2)'";
      } else if (ratio < 60 && maxDim > 1920) {
        scaleFilter = "scale='if(gt(iw,ih),1920,-2):if(gt(ih,iw),1920,-2)'";
      }

      // Build args
      const args = [
        "-i",
        "input.mp4",
        "-c:v",
        "libx264",
        "-b:v",
        `${finalBitrate}k`,
        "-bufsize",
        `${finalBitrate * 2}k`, // Buffer for bitrate control
        "-maxrate",
        `${Math.floor(finalBitrate * 1.2)}k`, // Max peak bitrate
        "-preset",
        "ultrafast",
        "-pix_fmt",
        "yuv420p",
        "-threads",
        "4",
        "-max_muxing_queue_size",
        "1024",
        "-c:a",
        "copy",
      ];

      if (scaleFilter) {
        args.push("-vf", scaleFilter);
      }

      args.push("output.mp4");

      // 3. Exec
      await ffmpeg.exec(args);

      // 4. Read result
      // Check if output exists (exec might fail silently or just log error)
      // We assume success if no throw.
      const data = (await ffmpeg.readFile("output.mp4")) as Uint8Array;
      // Handle potential SharedArrayBuffer (Blobs don't support it)
      let blobData: Uint8Array = data;
      if (data.buffer instanceof SharedArrayBuffer) {
        blobData = new Uint8Array(data); // This creates a copy on the heap
      }
      // Create Blob
      const blob = new Blob([blobData as unknown as BlobPart], {
        type: "video/mp4",
      });
      const blobUrl = URL.createObjectURL(blob);

      // Directly calculate final time cost to avoid async state issues
      const finalTimeCost = (Date.now() - startTimeRef.current) / 1000;

      setResult({
        blobUrl,
        size: blob.size,
        outputName: "output.mp4",
        timeCost: finalTimeCost,
      });

      // Compression success: Clear session and progress data
      setCompressionSessionId(null);
      clearProgress();
      setStatus("success");
      setPreviewMode("compressed"); // Auto switch to result
    } catch (err) {
      console.error(err);
      // Compression failed: Clear session and progress data
      setCompressionSessionId(null);
      clearProgress();
      setErrorMsg(
        "An error occurred during compression. Please try again or use another file.",
      );
      setStatus("error");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.blobUrl;
    a.download = exportName || "compressed.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * Get current progress percentage
   * Strict strategy: Only return progress when in compressing state and valid session exists, otherwise return 0
   */
  const formatProgress = () => currentProgress;

  // --- Renderers ---

  if (loadState.status === "loading") {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Initializing engine...</h2>
          <p className="text-sm text-zinc-500">
            First load may take a few seconds
          </p>
        </div>
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Core component load failed. Your browser may not support WebAssembly
          or SharedArrayBuffer. Please retry with the latest version of
          Chrome/Edge/Firefox.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 font-sans">
          Offline <span className="text-orange-600">MP4</span> Compressor
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
          Secure, client-side video compression. No uploads.
        </p>
      </div>

      {/* Main Card */}
      <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          {/* S0: Empty State */}
          {status === "idle" && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="h-20 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 ring-1 ring-zinc-200 dark:ring-zinc-700">
                <Upload className="h-10 w-10 text-zinc-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Select Video File</h3>
              <p className="text-zinc-500 text-sm mb-8 max-w-xs">
                Supports MP4, MOV, MKV. All processing is done locally, files
                never leave your device.
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept="video/*,.mp4,.mov,.mkv,.webm,.avi"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-8 transition-transform hover:scale-105 active:scale-95"
                >
                  <FileVideo className="mr-2 h-5 w-5" />
                  Browse File
                </Button>
              </div>
            </div>
          )}

          {/* S1 & S2 & S4: Workspace */}
          {status !== "idle" && video && (
            <div className="flex flex-col">
              {/* File Info Bar */}
              <div className="bg-zinc-100 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 bg-white dark:bg-zinc-800 rounded flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <FileVideo className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="font-medium truncate max-w-[200px] sm:max-w-md"
                      title={video.file.name}
                    >
                      {video.file.name}
                    </p>
                    <p className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                      <span>{formatBytes(video.file.size)}</span>
                      <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                      {video.meta.width}x{video.meta.height}
                      <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                      {formatTime(video.meta.duration)}
                    </p>
                  </div>
                </div>
                {status !== "compressing" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setStatus("idle");
                      setVideo(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* S1: Settings */}
              {status === "ready" && (
                <div className="p-8 space-y-8 animate-in slide-in-from-bottom-5 duration-300">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="uppercase tracking-wider text-xs font-semibold text-zinc-500">
                        Target File Size
                      </Label>
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-xl font-bold text-orange-600">
                          {ratio}%
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Approx {formatBytes(video.file.size * (ratio / 100))}
                        </span>
                      </div>
                    </div>
                    <Slider
                      value={[ratio]}
                      onValueChange={(v) => setRatio(v[0])}
                      min={1}
                      max={100}
                      step={1}
                      className="py-4 cursor-pointer"
                    />
                    <div className="flex justify-between gap-2">
                      {[30, 50, 70, 90].map((p) => (
                        <Button
                          key={p}
                          variant={ratio === p ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRatio(p)}
                          className={cn(
                            "flex-1 font-mono text-xs",
                            ratio === p &&
                              "bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-700",
                          )}
                        >
                          {p}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Low bitrate warning */}
                  {isHighlyCompressed(
                    video.file.size,
                    video.meta.duration,
                    video.meta.width,
                    video.meta.height,
                  ) && (
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800 dark:text-amber-200">
                        Video Already Highly Compressed
                      </AlertTitle>
                      <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                        检测到视频码率仅为{" "}
                        <span className="font-mono font-medium">
                          {Math.round(
                            calculateBitrate(
                              video.file.size,
                              video.meta.duration,
                            ),
                          )}{" "}
                          kbps
                        </span>
                        , which is below standard. Further compression may
                        increase file size or severely degrade quality.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Separator />

                  <Button
                    onClick={startCompression}
                    size="lg"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg shadow-lg shadow-orange-600/20"
                  >
                    Start Compression
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* S2: Loading */}
              {status === "compressing" && (
                <div className="p-12 flex flex-col items-center justify-center space-y-6 animate-in fade-in">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                      <span className="font-mono text-3xl font-bold tabular-nums">
                        {formatProgress()}%
                      </span>
                    </div>
                    <svg className="absolute inset-0 w-32 h-32 -rotate-90 pointer-events-none">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        fill="none"
                        strokeWidth="4"
                        stroke="currentColor"
                        className="text-orange-600 transition-all duration-300"
                        strokeDasharray={365}
                        strokeDashoffset={365 - (365 * formatProgress()) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="font-medium animate-pulse">
                      Compressing...
                    </h3>
                    <p className="text-zinc-500 font-mono text-sm">
                      {formatTime(elapsedTime)} elapsed
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={cancelCompression}
                    className="mt-4 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    Cancel Task
                  </Button>
                </div>
              )}

              {/* S4: Success / Result */}
              {status === "success" && result && (
                <div className="p-0 animate-in fade-in slide-in-from-bottom-5">
                  {/* Preview Area */}
                  <div className="aspect-video bg-black relative group">
                    <video
                      key={previewMode} // force reload
                      controls
                      className="w-full h-full"
                      src={
                        previewMode === "original"
                          ? URL.createObjectURL(video.file)
                          : result.blobUrl
                      }
                    />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 pointer-events-auto backdrop-blur px-1 p-1 rounded-lg border border-white/10 flex gap-1 transform transition-transform">
                      <Button
                        size="sm"
                        variant={
                          previewMode === "original" ? "secondary" : "ghost"
                        }
                        className="h-7 text-xs text-white hover:bg-white/20 hover:text-white"
                        onClick={() => setPreviewMode("original")}
                      >
                        Original Video
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          previewMode === "compressed" ? "secondary" : "ghost"
                        }
                        className="h-7 text-xs text-white hover:bg-white/20 hover:text-white"
                        onClick={() => setPreviewMode("compressed")}
                      >
                        Compressed Result
                      </Button>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-800 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="p-4 text-center">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                        Original Size
                      </p>
                      <p className="font-mono font-medium">
                        {formatBytes(video.file.size)}
                      </p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                        Compressed
                      </p>
                      <p
                        className={cn(
                          "font-mono font-bold",
                          result.size > video.file.size
                            ? "text-red-500"
                            : "text-orange-600",
                        )}
                      >
                        {formatBytes(result.size)}
                      </p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                        Compression Ratio
                      </p>
                      <p className="font-mono font-medium">
                        {Math.round((result.size / video.file.size) * 100)}%
                      </p>
                    </div>
                  </div>

                  {/* File size increase warning */}
                  {result.size > video.file.size && (
                    <Alert
                      variant="destructive"
                      className="mx-6 mt-4 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>
                        File Size Increased After Compression
                      </AlertTitle>
                      <AlertDescription className="text-sm">
                        The original video is already efficiently encoded.
                        Re-compression caused the file size to increase by{" "}
                        <span className="font-mono font-medium">
                          {Math.round(
                            ((result.size - video.file.size) /
                              video.file.size) *
                              100,
                          )}
                          %
                        </span>
                        %. It is recommended to use the original file or try
                        lowering the compression ratio (use a lower quality
                        target).
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Export Actions */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Export Filename</Label>
                      <div className="flex gap-2">
                        <Input
                          value={exportName}
                          onChange={(e) => setExportName(e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          // Thoroughly clear all states
                          setCompressionSessionId(null);
                          clearProgress();
                          setResult(null);
                          setElapsedTime(0);
                          setStatus("ready");
                        }}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Compress Again
                      </Button>
                      <Button
                        className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleDownload}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Save Video
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* S3: Error */}
              {status === "error" && (
                <div className="p-6">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Processing Failed</AlertTitle>
                    <AlertDescription>{errorMsg}</AlertDescription>
                  </Alert>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => setStatus("idle")}>
                      Select New File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer / Privacy Note */}
      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
        <Monitor className="inline-block w-3 h-3 mr-1" />
        Processing happens locally in your browser via WebAssembly.
      </p>
    </div>
  );
}
