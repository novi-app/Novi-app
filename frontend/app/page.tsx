"use client";

import Link from "next/link";
import { Logo } from "../components/logo";

export default function Home() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">

      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="absolute left-0 z-20" style={{ top: "9dvh", paddingLeft: "9vw" }}>
        <Logo size="lg" dark />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center"
        style={{ paddingLeft: "8vw", paddingRight: "8vw", paddingBottom: "6dvh" }}
      >
        <div
          className="w-full flex flex-col text-white tracking-wide mb-[3dvh]"
          style={{ fontSize: "clamp(28px, 11vw, 34px)", lineHeight: 1.3 }}
        >
          <p className="font-normal leading-relaxed">Less overthinking,</p>
          <p className="font-semibold">more exploring</p>
        </div>

        <Link href="/onboarding/intro/1" className="w-full">
          <button
            className="w-full font-semibold tracking-widest text-white transition-all active:scale-[0.97]"
            style={{
              height: "7dvh",
              minHeight: "48px",
              maxHeight: "64px",
              borderRadius: "15px",
              fontSize: "clamp(14px, 4vw, 16px)",
              letterSpacing: "0.08em",
              background: "#0D4A4A",
            }}
          >
            Get Started
          </button>
        </Link>
      </div>

    </div>
  );
}
