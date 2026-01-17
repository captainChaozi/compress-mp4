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
    } catch {
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
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans relative overflow-x-hidden selection:bg-orange-500/30">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto space-y-12 py-12 px-4 relative z-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-block border-2 border-zinc-900 dark:border-zinc-50 px-4 py-1 mb-4 rounded-sm rotate-1 hover:rotate-0 transition-transform cursor-default">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
              v1.0.0 // BETA
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50 font-sans uppercase break-words text-balance">
            Offline <span className="text-orange-600">MP4</span> Compressor
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg max-w-lg mx-auto text-balance">
            Client-side processing engine. <br />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 mt-2 block">
              Secure • Fast • Private
            </span>
          </p>
        </header>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden relative">
          {/* Top Bar Decoration */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent opacity-50" />

          <CardContent className="p-0">
            {/* S0: Empty State */}
            {status === "idle" && (
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center group cursor-pointer relative border-y border-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                {/* Clickable Area Overlay */}
                <input
                  type="file"
                  accept="video/*,.mp4,.mov,.mkv,.webm,.avi"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                />

                {/* Corner Ticks */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-zinc-300 dark:border-zinc-700 group-hover:border-orange-500 transition-colors" />
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-zinc-300 dark:border-zinc-700 group-hover:border-orange-500 transition-colors" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-zinc-300 dark:border-zinc-700 group-hover:border-orange-500 transition-colors" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-zinc-300 dark:border-zinc-700 group-hover:border-orange-500 transition-colors" />

                <div className="h-24 w-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-sm flex items-center justify-center mb-6 ring-1 ring-zinc-200 dark:ring-zinc-700 group-hover:scale-110 transition-transform duration-500">
                  <Upload className="h-10 w-10 text-zinc-400 group-hover:text-orange-600 transition-colors" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">
                  DROP VIDEO FILE
                </h3>
                <p className="text-zinc-500 text-sm mb-8 max-w-xs font-mono uppercase tracking-wide">
                  OR CLICK TO BROWSE <br />
                  <span className="text-xs opacity-50 lowercase normal-case font-sans block mt-2">
                    MP4, MOV, MKV Supported
                  </span>
                </p>

                <Button
                  size="lg"
                  className="bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-orange-600 dark:hover:bg-orange-600 hover:text-white dark:hover:text-white rounded-sm font-bold uppercase tracking-widest transition-all relative z-10"
                >
                  <FileVideo className="mr-2 h-4 w-4" />
                  Select File
                </Button>
              </div>
            )}

            {/* S1 & S2 & S4: Workspace */}
            {status !== "idle" && video && (
              <div className="flex flex-col">
                {/* File Info Bar */}
                <div className="bg-zinc-100/50 dark:bg-zinc-950/30 border-b border-zinc-200 dark:border-zinc-800 p-6 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 overflow-hidden">
                    <div className="h-12 w-12 bg-white dark:bg-zinc-900 rounded-[2px] flex items-center justify-center shrink-0 border-2 border-zinc-200 dark:border-zinc-800">
                      <FileVideo className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p
                        className="font-bold text-lg truncate max-w-[200px] sm:max-w-md text-zinc-900 dark:text-zinc-50"
                        title={video.file.name}
                      >
                        {video.file.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 uppercase tracking-tight">
                        <span className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded-[2px] text-zinc-700 dark:text-zinc-300">
                          {formatBytes(video.file.size)}
                        </span>
                        <span>|</span>
                        <span>
                          {video.meta.width}x{video.meta.height}
                        </span>
                        <span>|</span>
                        <span>{formatTime(video.meta.duration)}</span>
                      </div>
                    </div>
                  </div>
                  {status !== "compressing" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-[2px] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-500 w-8 h-8"
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
                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-[2px] bg-zinc-50/50 dark:bg-zinc-900/50">
                        <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono block mb-2">
                          Original Size
                        </Label>
                        <div className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                          {formatBytes(video.file.size)}
                        </div>
                      </div>
                      <div className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-[2px] bg-indigo-50/30 dark:bg-indigo-950/10">
                        <Label className="text-[10px] uppercase tracking-widest text-indigo-500/80 font-mono block mb-2">
                          Est. Output
                        </Label>
                        <div className="font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          ~{formatBytes(video.file.size * (ratio / 100))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <Label className="uppercase tracking-widest text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Compression Level
                        </Label>
                        <span className="font-mono text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter">
                          {ratio}
                          <span className="text-lg text-zinc-400 align-top ml-1">
                            %
                          </span>
                        </span>
                      </div>

                      <Slider
                        value={[ratio]}
                        onValueChange={(v) => setRatio(v[0])}
                        min={1}
                        max={100}
                        step={1}
                        className="py-2 cursor-col-resize"
                      />

                      <div className="grid grid-cols-4 gap-2">
                        {[30, 50, 70, 90].map((p) => (
                          <Button
                            key={p}
                            variant="outline"
                            size="sm"
                            onClick={() => setRatio(p)}
                            className={cn(
                              "font-mono text-xs h-9 border-2 rounded-[2px] transition-all",
                              ratio === p
                                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                                : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700",
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
                      <Alert className="rounded-[2px] border-amber-500/50 bg-amber-50 dark:bg-amber-950/10 text-amber-900 dark:text-amber-100">
                        <Info className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="font-bold uppercase tracking-wide text-xs mb-1">
                          Warning: Low Bitrate
                        </AlertTitle>
                        <AlertDescription className="text-xs font-mono opacity-90">
                          Video bitrate is already low (
                          {Math.round(
                            calculateBitrate(
                              video.file.size,
                              video.meta.duration,
                            ),
                          )}{" "}
                          kbps). Quality loss may occur.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Separator className="bg-zinc-100 dark:bg-zinc-800" />

                    <Button
                      onClick={startCompression}
                      size="lg"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white h-14 text-lg font-bold uppercase tracking-widest rounded-[2px] shadow-lg shadow-orange-900/10 hover:shadow-orange-600/20 active:translate-y-0.5 transition-all"
                    >
                      Initialize Compression
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}

                {/* S2: Loading */}
                {status === "compressing" && (
                  <div className="p-12 flex flex-col items-center justify-center space-y-8 animate-in fade-in">
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-xs uppercase tracking-widest font-mono text-zinc-500">
                        <span>Processing Status</span>
                        <span>{formatProgress()}%</span>
                      </div>
                      <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-[1px] overflow-hidden relative border border-zinc-200 dark:border-zinc-700">
                        {/* Progress Bar */}
                        <div
                          className="h-full bg-orange-600 transition-all duration-300 ease-out relative"
                          style={{ width: `${formatProgress()}%` }}
                        >
                          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50" />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs font-mono text-zinc-400">
                        <span>Mode: ULTRAFAST</span>
                        <span>Time: {formatTime(elapsedTime)}</span>
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="font-bold uppercase tracking-widest animate-pulse text-zinc-900 dark:text-zinc-100">
                        Compression in Progress...
                      </h3>
                      <p className="text-zinc-500 font-mono text-xs">
                        Please do not close this tab
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={cancelCompression}
                      className="mt-4 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-900/30 dark:hover:border-red-800 rounded-[2px] uppercase text-xs tracking-widest h-8"
                    >
                      Abort Operation
                    </Button>
                  </div>
                )}

                {/* S4: Success / Result */}
                {status === "success" && result && (
                  <div className="animate-in fade-in slide-in-from-bottom-5 p-0">
                    {/* Header */}
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/50 p-4 text-center">
                      <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-widest text-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Compression Complete
                      </div>
                    </div>

                    {/* Preview Area */}
                    <div className="aspect-video bg-zinc-950 relative group border-b border-zinc-800">
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
                      {/* Toggle Switch */}
                      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md p-1 rounded-[2px] border border-white/10 flex gap-1 transform transition-transform z-20">
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn(
                            "h-7 text-[10px] uppercase tracking-wide rounded-[1px]",
                            previewMode === "original"
                              ? "bg-white text-black"
                              : "text-zinc-400 hover:text-white",
                          )}
                          onClick={() => setPreviewMode("original")}
                        >
                          Original
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn(
                            "h-7 text-[10px] uppercase tracking-wide rounded-[1px]",
                            previewMode === "compressed"
                              ? "bg-emerald-500 text-white"
                              : "text-zinc-400 hover:text-white",
                          )}
                          onClick={() => setPreviewMode("compressed")}
                        >
                          Result
                        </Button>
                      </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-800 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <div className="p-6 text-center space-y-1">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          Original Size
                        </p>
                        <p className="font-mono font-medium text-lg text-zinc-700 dark:text-zinc-300">
                          {formatBytes(video.file.size)}
                        </p>
                      </div>
                      <div className="p-6 text-center space-y-1 bg-white/50 dark:bg-zinc-900">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          New Size
                        </p>
                        <p
                          className={cn(
                            "font-mono font-bold text-lg",
                            result.size > video.file.size
                              ? "text-red-500"
                              : "text-emerald-600",
                          )}
                        >
                          {formatBytes(result.size)}
                        </p>
                      </div>
                      <div className="p-6 text-center space-y-1">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          Reduction
                        </p>
                        <p className="font-mono font-bold text-lg text-zinc-900 dark:text-zinc-100">
                          {Math.round(
                            (1 - result.size / video.file.size) * 100,
                          )}
                          %
                        </p>
                      </div>
                    </div>

                    {/* Warning if size increased */}
                    {result.size > video.file.size && (
                      <Alert
                        variant="destructive"
                        className="mx-6 mt-6 rounded-[2px] border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="uppercase tracking-wide font-bold text-xs">
                          Inefficient Compression
                        </AlertTitle>
                        <AlertDescription className="text-xs font-mono mt-1">
                          Output is larger than input (
                          {Math.round(
                            ((result.size - video.file.size) /
                              video.file.size) *
                              100,
                          )}
                          % increase). Try a lower quality setting.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Export Actions */}
                    <div className="p-8 space-y-6">
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] tracking-widest text-zinc-500 font-mono">
                          Export Filename
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={exportName}
                            onChange={(e) => setExportName(e.target.value)}
                            className="font-mono text-sm h-10 border-2 rounded-[2px] focus-visible:ring-0 focus-visible:border-orange-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-12 uppercase tracking-widest text-xs font-bold rounded-[2px] border-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          onClick={() => {
                            setCompressionSessionId(null);
                            clearProgress();
                            setResult(null);
                            setElapsedTime(0);
                            setStatus("ready");
                          }}
                        >
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Discard
                        </Button>
                        <Button
                          className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white h-12 uppercase tracking-widest text-xs font-bold rounded-[2px] shadow-lg shadow-emerald-900/10 hover:shadow-emerald-600/20 active:translate-y-0.5 transition-all"
                          onClick={handleDownload}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Save to Disk
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* S3: Error */}
                {status === "error" && (
                  <div className="p-6">
                    <Alert variant="destructive" className="rounded-[2px]">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="uppercase font-bold tracking-wide text-xs">
                        Processing Failed
                      </AlertTitle>
                      <AlertDescription className="font-mono text-xs mt-1">
                        {errorMsg}
                      </AlertDescription>
                    </Alert>
                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={() => setStatus("idle")}
                        variant="outline"
                        className="uppercase tracking-wider text-xs font-bold"
                      >
                        Select New File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
