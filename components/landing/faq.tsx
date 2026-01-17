"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "Can I compress MP4 files completely offline?",
    answer:
      "Yes! We use FFmpeg.wasm technology to compress MP4 videos entirely inside your web browser. Once the page loads, you can even disconnect from the internet and continue to compress MP4 files.",
  },
  {
    question: "Is there a file size limit to compress MP4?",
    answer:
      "There's no hard limit. However, since MP4 compression happens in browser memory, very large files (e.g., >2GB) might cause issues depending on your device's available RAM.",
  },
  {
    question: "What video formats can I compress?",
    answer:
      "You can compress MP4, MOV, MKV, WEBM, and AVI files. All compressed videos are output as MP4 (H.264 + AAC) for maximum compatibility.",
  },
  {
    question: "Does compressing MP4 reduce video quality?",
    answer:
      "Compression involves a trade-off between file size and quality. Our smart algorithms minimize visible quality loss when you compress MP4 files. Use the ratio slider to control compression aggressiveness.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="w-full max-w-5xl mx-auto py-16 px-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="h-5 w-1 bg-orange-600" />
        <h2 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="border border-zinc-200 dark:border-zinc-800 rounded-[4px] overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
            >
              <span className="font-medium text-base text-zinc-900 dark:text-zinc-100">
                {faq.question}
              </span>
              {openIndex === idx ? (
                <ChevronUp className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              )}
            </button>
            {openIndex === idx && (
              <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
