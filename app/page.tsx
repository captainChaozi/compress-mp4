import CTA from "@/components/landing/cta";
import FAQ from "@/components/landing/faq";
import Feature from "@/components/landing/feature";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import VideoCompressor from "@/components/video-compressor";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px]">
      <Header />
      <main className="flex flex-col items-center">
        <section
          id="compressor"
          className="w-full py-12 px-4 flex flex-col items-center justify-center gap-6"
        >
          <VideoCompressor />
        </section>
        <Feature />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
