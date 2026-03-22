"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingHeader } from "../intro/[step]/page";
import { trackOnboardingStepCompleted } from "@/lib/analytics";
import { useOnboardingAbandoned } from "@/hooks/useOnboardingAbandoned";
import { DIETARY, LS_DIETARY, LS_USER_ID } from "@/lib/onboarding";


export default function DietaryPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const markCompleted = useOnboardingAbandoned(5, "DIETARY");

  useEffect(() => {
    if (localStorage.getItem(LS_USER_ID)) {
      router.replace("/tabs/home");
      return;
    }
    const saved = localStorage.getItem(LS_DIETARY);
    if (saved) setSelected(JSON.parse(saved));
  }, [router]);

  const toggle = (val: string) => {
    setSelected(prev => {
      if (val === "none") return ["none"];
      const without = prev.filter(v => v !== "none");
      return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
    });
  };

  const handleNext = () => {
    if (!selected.length) return;
    
    localStorage.setItem(LS_DIETARY, JSON.stringify(selected));
    
    const timeOnStep = Math.round((Date.now() - startTime) / 1000);
    markCompleted();
    trackOnboardingStepCompleted(5, "DIETARY", selected, timeOnStep);
    
    router.push("/onboarding/budget");
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-cream">
      <div className="bg-secondary px-6 flex-shrink-0" style={{ paddingTop: "4dvh", paddingBottom: "4dvh" }}>
        <div className="max-w-md mx-auto flex flex-col" style={{ gap: "3dvh" }}>
          <OnboardingHeader current={4} onBack={() => router.back()} darkBg />
          <div className="text-center">
            <h1
              className="font-display text-cream-text leading-tight"
              style={{ fontSize: "clamp(22px, 6vw, 30px)", letterSpacing: "-0.02em" }}
            >
              Any food preferences?
            </h1>
            <p className="text-cream-text opacity-80 mt-2" style={{ fontSize: "clamp(13px, 3.8vw, 20px)" }}>
              So you never have to second-guess the menu
            </p>
          </div>
        </div>
      </div>

      <main
        className="flex-1 overflow-y-auto px-6 pb-2 max-w-md mx-auto w-full"
        style={{ paddingTop: "3dvh", scrollbarWidth: "none" }}
      >
        <p className="font-bold text-black mb-[2dvh]" style={{ fontSize: "clamp(13px, 4vw, 18px)" }}>
          Select all that apply
        </p>
        <div className="flex flex-col gap-3">
          {DIETARY.map(opt => {
            const isSelected = selected.includes(opt.value);
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="w-full text-left rounded-2xl px-5 py-6 flex items-center gap-4 transition-all"
                style={{
                  background: isSelected ? "#0B4F4A" : "#faf8f3",
                  border: isSelected ? "1.5px solid #0B4F4A" : "1.5px solid rgba(11,79,74,0.08)",
                  boxShadow: "0 2px 4px -2px rgba(0,0,0,0.1)",
                }}
              >
                <Icon
                  width={25}
                  height={25}
                  className="shrink-0"
                  style={{ color: isSelected ? "#faf8f3" : "#000000" }}
                />
                <p
                  className="font-semibold"
                  style={{ fontSize: "clamp(14px, 4vw, 18px)", color: isSelected ? "#faf8f3" : "#0D4A4A" }}
                >
                  {opt.label}
                </p>
              </button>
            );
          })}
        </div>
      </main>

      <div className="flex-shrink-0 px-6 max-w-md mx-auto w-full" style={{ paddingBottom: "5dvh", paddingTop: "2dvh" }}>
        <button
          onClick={handleNext}
          disabled={selected.length === 0}
          className="w-full flex items-center justify-center gap-2 font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            height: "7dvh",
            minHeight: "48px",
            maxHeight: "64px",
            borderRadius: "15px",
            fontSize: "clamp(15px, 3.8vw, 16px)",
            background: "#E8700A",
          }}
        >
          Continue ➔
        </button>
      </div>

    </div>
  );
}
