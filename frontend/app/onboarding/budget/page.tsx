"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingHeader } from "../intro/[step]/page";
import { trackOnboardingStepCompleted, trackOnboardingCompleted, identifyUser, getDeviceType } from "@/lib/analytics";
import { BUDGET, LS_USER_ID, LS_USER_NAME, LS_ACTIVITY, LS_DIETARY, LS_BUDGET } from "@/lib/onboarding";


export default function BudgetPage() {
  const router = useRouter();
  const [selected, setSelected]       = useState<number | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [startTime]                   = useState(Date.now());

  useEffect(() => {
    if (localStorage.getItem(LS_USER_ID)) {
      // router.replace("/recommendations");
      router.push("/");
      return;
    }
    const saved = localStorage.getItem(LS_BUDGET);
    if (saved) setSelected(JSON.parse(saved));
  }, [router]);

  const handleSubmit = async () => {
    if (selected === null || isSubmitting) return;
    setSubmitting(true);

    localStorage.setItem(LS_BUDGET, JSON.stringify(selected));

    const timeOnStep = Math.round((Date.now() - startTime) / 1000);
    trackOnboardingStepCompleted(4, "BUDGET", selected, timeOnStep);

    // const activity: string[] = JSON.parse(localStorage.getItem(LS_ACTIVITY) ?? "[]");
    // const dietary: string[]  = JSON.parse(localStorage.getItem(LS_DIETARY)  ?? "[]");
    // const name: string[] = JSON.parse(localStorage.getItem(LS_USER_NAME) ?? "[]");

    // try {
    //   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/onboard`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       username: name,
    //       preferences: {
    //         dietary,
    //         budget:              selected,
    //         activity_preference: activity,
    //       },
    //     }),
    //   });
    //   if (!response.ok) throw new Error("Onboarding failed");
    //   const result = await response.json();

    //   localStorage.setItem(LS_USER_ID, result.user_id);

    //   identifyUser(result.user_id, {
    //     dietary,
    //     budget:      selected,
    //     activities:  activity,
    //     signup_date: new Date().toISOString(),
    //     device_type: getDeviceType(),
    //   });

    //   const totalTime = Math.round((Date.now() - startTime) / 1000);
    //   trackOnboardingCompleted(totalTime, dietary, selected, activity);

      router.push("/onboarding/finish");
    // } catch (err) {
    //   console.error("Onboarding error:", err);
    //   alert("Something went wrong. Please try again.");
    //   setSubmitting(false);
    // }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-cream">

      <div className="bg-secondary px-6 flex-shrink-0" style={{ paddingTop: "4dvh", paddingBottom: "4dvh" }}>
        <div className="max-w-md mx-auto flex flex-col" style={{ gap: "3dvh" }}>
          <OnboardingHeader current={5} onBack={() => router.back()} darkBg />
          <div className="text-center">
            <h1
              className="font-display text-cream-text leading-tight"
              style={{ fontSize: "clamp(22px, 6vw, 30px)", letterSpacing: "-0.02em" }}
            >
              What's your spending style?
            </h1>
            <p className="text-cream-text opacity-80 mt-2" style={{ fontSize: "clamp(13px, 3.8vw, 20px)" }}>
              So every recommendation fits your wallet
            </p>
          </div>
        </div>
      </div>

      <main
        className="flex-1 overflow-y-auto px-6 pb-2 max-w-md mx-auto w-full"
        style={{ paddingTop: "3dvh", scrollbarWidth: "none" }}
      >
        <p className="font-bold text-black mb-[2dvh]" style={{ fontSize: "clamp(13px, 4vw, 18px)" }}>
          Select one
        </p>
        <div className="flex flex-col gap-3">
          {BUDGET.map(opt => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className="w-full text-left rounded-2xl px-5 py-6 transition-all flex items-center gap-4"
                style={{
                  background: isSelected ? "#0B4F4A" : "#faf8f3",
                  border: isSelected ? "2px solid #0B4F4A" : "2px solid #0D4A4A1F",
                }}
              >
                <p
                  className="font-bold mt-0.5"
                  style={{ fontSize: "clamp(12px, 4vw, 18px)", color: isSelected ? "#faf8f3" : "rgb(0,0,0)" }}
                >
                  {opt.symbol}
                </p>
                <p
                  className="font-bold"
                  style={{ fontSize: "clamp(14px, 4vw, 19px)", color: isSelected ? "#faf8f3" : "#0D4A4A" }}
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
          onClick={handleSubmit}
          disabled={selected === null || isSubmitting}
          className="w-full flex items-center justify-center gap-2 font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            height: "7dvh",
            minHeight: "48px",
            maxHeight: "64px",
            borderRadius: "15px",
            fontSize: "clamp(15px, 3.8vw, 16px)",
            background: "#E8700A",
          }}
        >
          {isSubmitting ? "Just a moment…" : "Continue ➔"}
        </button>
      </div>

    </div>
  );
}
