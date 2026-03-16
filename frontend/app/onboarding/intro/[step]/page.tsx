"use client";

import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

export function OnboardingHeader({ current, onBack, darkBg = false }: {
  current: number;
  onBack: () => void;
  darkBg?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={onBack}
        className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full shadow-md hover:opacity-80 transition-opacity`}
        style={{ backgroundColor: darkBg ? "#ffffff" : "#0D4A4A" }}
        aria-label="Go back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke={darkBg ? "#000000" : "#ffffff"}
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              height: "8px",
              width: i === current ? "clamp(28px, 14vw, 50px)" : "8px",
              background: i === current
                ? darkBg ? "#E8700A" : "#0D4A4A"
                : i < current
                  ? darkBg ? "rgba(255,255,255,0.6)" : "rgba(13,74,74,0.35)"
                  : "#99A1AF",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const SCREENS = [
  {
    image: "/intro1.jpg",
    title: "Built around you",
    body: "The more you explore, the smarter Novi gets — and when you're overwhelmed, it knows exactly when to step in.",
    stat: true,
    cta: "Next",
  },
  {
    image: "/intro2.jpg",
    title: "Your next best move, \n right where you are",
    body: "Your location is only used when Novi is open. We never track you in the background or share your data.",
    stat: false,
    cta: "Next",
  },
];

function TealButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full font-semibold text-white transition-all active:scale-[0.98]"
      style={{
        height: "7dvh",
        minHeight: "48px",
        maxHeight: "64px",
        borderRadius: "15px",
        fontSize: "clamp(15px, 4vw, 18px)",
        background: "#0D4A4A",
      }}
    >
      {label}
    </button>
  );
}

export default function IntroStepPage() {
  const router = useRouter();
  const params = useParams();
  const step   = Number(params.step);
  const idx    = step - 1;
  const screen = SCREENS[idx];

  if (!screen) {
    router.replace("/onboarding/intro/1");
    return null;
  }

  const handleNext = () => {
    if (step < 2) {
      router.push(`/onboarding/intro/${step + 1}`);
    } else {
      router.push("/onboarding/name");
    }
  };

  return (
    <div
      className="h-[100dvh] w-full bg-cream flex flex-col px-7"
      style={{ paddingTop: "4dvh", paddingBottom: "6dvh", gap: "3.5dvh" }}
    >
      <OnboardingHeader current={step - 1} onBack={() => router.back()} />
      <div
        className="relative overflow-hidden flex-shrink-0 rounded-2xl"
        style={{ height: "44dvh" }}
      >
        <Image
          src={screen.image}
          alt={screen.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="flex flex-col flex-shrink-0 gap-[2dvh] px-1">
        <h1
          className="font-display font-bold text-black text-center"
          style={{ fontSize: "clamp(20px, 5.5vw, 26px)", letterSpacing: "-0.02em", whiteSpace: "pre-line" }}
        >
          {screen.title}
        </h1>

        <p
          className="text-neutral-500 text-center leading-relaxed"
          style={{ fontSize: "clamp(13px, 4vw, 15px)" }}
        >
          {screen.body}
        </p>

        {screen.stat && (
          <div
            className="flex items-center justify-center gap-5 rounded-2xl px-6 py-4"
            style={{ background: "#ffffff", boxShadow: "0 4px 4px rgba(0,0,0,0.25)" }}
          >
            <div className="text-center">
              <p className="font-bold text-black" style={{ fontSize: "clamp(15px, 5vw, 18px)" }}>18+ min</p>
              <p className="text-neutral-400" style={{ fontSize: "clamp(10px, 3vw, 12px)" }}>lost to scrolling</p>
            </div>
            <span className="text-neutral-300 text-4xl font-bold">→</span>
            <div className="text-center">
              <p className="font-bold" style={{ fontSize: "clamp(15px, 5vw, 18px)", color: "#E8700A" }}>&lt; 5 min</p>
              <p className="text-neutral-400" style={{ fontSize: "clamp(10px, 3vw, 12px)" }}>back to exploring</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-end flex-1">
        <TealButton label={screen.cta} onClick={handleNext} />
      </div>
    </div>
  );
}
