import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export const getVideoMetadata = (
  file: File,
): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    // Mute is required for autoplay policies on mobile
    video.muted = true;
    // playsInline is required for iOS Safari
    video.playsInline = true;

    // Timeout to prevent infinite pending on some mobile browsers
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Video metadata loading timeout"));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      video.onloadedmetadata = null;
      video.onerror = null;
      if (video.src) {
        window.URL.revokeObjectURL(video.src);
      }
    };

    video.onloadedmetadata = () => {
      cleanup();
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Unable to parse video file"));
    };

    video.src = window.URL.createObjectURL(file);
    // Explicitly call load() - required for mobile browsers
    video.load();
  });
};
