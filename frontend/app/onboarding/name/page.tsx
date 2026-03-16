"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingHeader } from "../intro/[step]/page";
import { trackOnboardingStarted, trackOnboardingStepCompleted } from "@/lib/analytics";
import { LS_USER_NAME, LS_USER_ID } from "@/lib/onboarding";
import ReactMarkdown from "react-markdown";

export default function NamePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [showPolicy, setShowPolicy] = useState(false);
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch("/docs/PRIVACY_POLICY.md")
      .then((res) => res.text())
      .then(setContent);
  }, []);

  useEffect(() => {
    if (localStorage.getItem(LS_USER_ID)) {
      // router.replace("/recommendations");
      router.replace("/");
      return;
    }
    trackOnboardingStarted();
    const saved = localStorage.getItem(LS_USER_NAME);
    if (saved) setName(saved);
  }, [router]);

  const handleNext = () => {
    if (!name.trim()) return;
    localStorage.setItem(LS_USER_NAME, name.trim());
    trackOnboardingStepCompleted(1, "NAME", name.trim(), 0);
    router.push("/onboarding/activity");
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-cream">
      <div className="bg-secondary px-6 flex-shrink-0" style={{ paddingTop: "4dvh", paddingBottom: "4dvh" }}>
        <div className="max-w-md mx-auto flex flex-col" style={{ gap: "3dvh" }}>
          <OnboardingHeader current={2} onBack={() => router.back()} darkBg />
          <div className="text-center">
            <h1
              className="font-display text-cream-text leading-tight"
              style={{ fontSize: "clamp(22px, 6vw, 30px)", letterSpacing: "-0.02em" }}
            >
              What should Novi call you?
            </h1>
            <p className="text-cream-text opacity-80 mt-2" style={{ fontSize: "clamp(13px, 3.8vw, 20px)" }}>
              So we can make it feel like yours
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 px-6 max-w-md mx-auto w-full" style={{ paddingTop: "5dvh" }}>
        <label className="block font-bold text-black mb-2" style={{ fontSize: "clamp(13px, 4vw, 18px)" }}>
          First name<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => {
            let value = e.target.value.replace(/[^\p{L}]/gu, "").slice(0, 25);
            setName(value);
          }}
          onKeyDown={e => e.key === "Enter" && handleNext()}
          placeholder="Enter your name"
          autoFocus
          className="w-full bg-white rounded-2xl px-4 text-neutral-500 font-bold placeholder:text-secondary/30 outline-none transition-all"
          style={{
            height: "7dvh",
            minHeight: "48px",
            maxHeight: "64px",
            fontSize: "clamp(14px, 3.5vw, 16px)",
            border: "1.5px solid rgba(11,79,74,0.1)",
          }}
          onFocus={e => (e.target.style.borderColor = "rgba(11,79,74,0.35)")}
          onBlur={e => (e.target.style.borderColor = "rgba(11,79,74,0.1)")}
        />
      </main>

      <div className="flex-shrink-0 px-6 max-w-md mx-auto w-full" style={{ paddingBottom: "5dvh", paddingTop: "2dvh" }}>
        <p className="text-black mb-[4dvh]" style={{ fontSize: "clamp(11px, 3.5vw, 14px)", lineHeight: 1.5 }}>
          By continuing, you agree to our{" "}
          <span
            className="underline cursor-pointer"
            onClick={() => setShowPolicy(true)}
          >
            Terms & Privacy Policy
          </span>.
        </p>
        <button
          onClick={handleNext}
          disabled={!name.trim()}
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

      {showPolicy && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowPolicy(false)}
        >
          <div
            className="bg-white flex flex-col"
            style={{ height: "90dvh", borderRadius: "20px 20px 0 0" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 rounded-full bg-gray-300" style={{ height: "4px" }} />
            </div>

            <div className="flex px-6 pb-4 flex-shrink-0 justify-end">
              <button
                onClick={() => setShowPolicy(false)}
                className="text-secondary/50 leading-none"
                style={{ fontSize: "28px" }}
              >
                ×
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto px-6 pb-8"
              style={{ scrollbarWidth: "none" }}
            >
              <div className="prose prose-sm max-w-none text-secondary">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
