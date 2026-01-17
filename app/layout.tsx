import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://compressmp4.org"),
  title: "Compress MP4: Free Offline Video Compressor",
  description:
    "Compress MP4 files locally in your browser. Free, 100% private, and offline. Reduce video size instantly without uploading.",
  alternates: {
    canonical: "https://compressmp4.org",
  },
  openGraph: {
    title: "Compress MP4 - Free Offline Video Compressor",
    description:
      "Compress MP4 videos directly in your browser. No file upload required, 100% offline & private. Reduce video size instantly.",
    images: ["/feature-image.png"],
    url: "https://compressmp4.org",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compress MP4 - Free Offline Video Compressor",
    description:
      "Compress MP4 videos offline in your browser. No upload, 100% private.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script
          defer
          data-domain="compressmp4.org"
          src="https://zz.yfyyu.com/js/script.file-downloads.outbound-links.pageview-props.revenue.tagged-events.js"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
        </Script>
      </body>
    </html>
  );
}
