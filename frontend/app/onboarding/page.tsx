"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { Button } from "@/components/button";
import { trackOnboardingStarted, trackOnboardingStepCompleted, trackOnboardingCompleted, identifyUser, getDeviceType } from "@/lib/analytics";


interface OnboardingData {
  dietary:  string[];
  budget:   number;
  activity: string[];
}

const DIETARY = [
  { value: "none",        label: "No restrictions",  sub: "I eat everything"                 },
  { value: "vegetarian",  label: "Vegetarian",       sub: "No meat or fish"                  },
  { value: "vegan",       label: "Vegan",            sub: "No animal products"               },
  { value: "gluten-free", label: "Gluten-free",      sub: "No wheat or gluten"               },
  { value: "dairy-free",  label: "Dairy-free",       sub: "No milk products"                 },
  { value: "halal",       label: "Halal",            sub: "Permissible by Islamic law"       },
  { value: "kosher",      label: "Kosher",           sub: "Prepared according to Jewish law" },
];

const BUDGET = [
  { value: 1, symbol: "$",   label: "Thrifty"  },
  { value: 2, symbol: "$$",  label: "Moderate" },
  { value: 3, symbol: "$$$", label: "Splurge"  },
];

const ACTIVITY = [
  { value: "food",     label: "Food & Dining",     description: "Restaurants, cafes, street food" },
  { value: "social",   label: "Social & Nightlife", description: "Bars, clubs, social spaces"      },
  { value: "explore",  label: "Explore & Culture",  description: "Museums, temples, sightseeing"   },
  { value: "unwind",   label: "Unwind & Wellness",  description: "Onsen, spas, quiet spaces"       },
  { value: "shopping", label: "Shopping",           description: "Markets, malls, boutiques"       },
];

// stepIndex: -4=home, -3/-2/-1=teal screens, 0-2=preference steps
const PREF_STEPS = [
  { id: "dietary",  label: "Dietary",  question: "What do you eat?",   hint: "We'll filter the city to your taste"    },
  { id: "budget",   label: "Budget",   question: "Your comfort zone?", hint: "Recommendations stay within your range" },
  { id: "activity", label: "Activity", question: "What's your vibe?",  hint: "Pick the moods that make you happy"     },
];


function FilmGrain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-50 opacity-[0.035] mix-blend-soft-light"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
      }}
    />
  );
}


function GesturalBackground() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 390 844"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <circle cx="195" cy="360" r="300" stroke="white" strokeWidth="0.6" opacity="0.05" />
      <circle cx="195" cy="360" r="210" stroke="white" strokeWidth="0.4" opacity="0.04" />
      <circle cx="195" cy="360" r="130" stroke="white" strokeWidth="0.4" opacity="0.03" />
      <line x1="195" y1="40"  x2="195" y2="680" stroke="white" strokeWidth="0.5" opacity="0.04" />
      <line x1="-110" y1="360" x2="500" y2="360" stroke="white" strokeWidth="0.5" opacity="0.04" />
      <line x1="0"   y1="150" x2="390" y2="570" stroke="white" strokeWidth="0.4" opacity="0.025" />
      <line x1="390" y1="150" x2="0"   y2="570" stroke="white" strokeWidth="0.4" opacity="0.025" />
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const r = 300;
        const x1 = 195 + (r - 12) * Math.sin(rad);
        const y1 = 360 - (r - 12) * Math.cos(rad);
        const x2 = 195 + (r + 12) * Math.sin(rad);
        const y2 = 360 - (r + 12) * Math.cos(rad);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1" opacity="0.1" />;
      })}
    </svg>
  );
}


function HomeScreen({ onEnter }: { onEnter: () => void }) {
  const [expanding, setExpanding] = React.useState(false);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: expanding ? "#000" : "#0B4F4A" }}
    >
      <FilmGrain />

      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-0 h-[57%] md:h-[52%]"
        animate={{ opacity: expanding ? 0 : 1 }}
        transition={{ duration: 0.15, ease: "easeIn" }}
      >
        <div
          className="absolute inset-0 animate-zoom-out bg-cover"
          style={{ backgroundImage: "url(/bg.jpg)", backgroundPosition: "50% 20%" }}
        />
        <div className="absolute inset-0 bg-secondary/20" />
        <div className="absolute inset-0 bg-secondary/30" style={{ mixBlendMode: "color" }} />
        <div
          className="absolute inset-x-0 top-0 h-[55%]"
          style={{ background: "linear-gradient(to bottom, rgba(11,79,74,0.72) 0%, rgba(11,79,74,0.15) 70%, transparent 100%)" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[65%]"
          style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(11,79,74,0.45) 30%, rgba(11,79,74,0.88) 60%, #0B4F4A 80%)" }}
        />
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-10 bg-secondary"
        initial={{ height: "45%" }}
        animate={{ height: expanding ? "100%" : "45%" }}
        transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
        onAnimationComplete={() => { if (expanding) onEnter(); }}
      />

      <motion.div
        className="absolute inset-x-0 top-0 z-20 flex justify-center pt-11 animate-fade-in md:pt-14"
        animate={{ opacity: expanding ? 0 : 1 }}
        transition={{ duration: 0.15, ease: "easeIn" }}
      >
        <Logo size="lg" dark />
      </motion.div>

      <motion.div
        className="absolute inset-x-0 bottom-0 z-20 flex -translate-y-4 flex-col items-center px-6 pb-8 text-center md:pb-12"
        animate={{ opacity: expanding ? 0 : 1 }}
        transition={{ duration: 0.15, ease: "easeIn" }}
      >
        <div className="mb-6 flex animate-line items-center gap-[10px]" style={{ transformOrigin: "center center" }}>
          <div className="h-px w-9 bg-primary/55" />
          <div className="h-[5px] w-[5px] rounded-full bg-primary" style={{ boxShadow: "0 0 8px rgba(217,125,62,0.6)" }} />
          <div className="h-px w-9 bg-primary/65" />
        </div>
        <h1
          className="animate-fade-up font-display font-medium text-white md:whitespace-nowrap"
          style={{ fontSize: "clamp(36px, 11vw, 58px)", lineHeight: 1.15, letterSpacing: "-0.02em" }}
        >
          Keep the wonder,{" "}
          <br className="md:hidden" />
          lose the worry.
        </h1>
        <p
          className="animate-fade-up-2 mt-4 max-w-[300px] leading-relaxed md:max-w-md"
          style={{ fontSize: "clamp(14px, 3.8vw, 16px)", color: "rgba(255,255,255,0.58)", letterSpacing: "0.008em" }}
        >
          Tell us what you love. We design your day. <br></br> From early light to late night bites, <br></br> your day unfolds effortlessly.
        </p>
        <div className="animate-fade-up-3 mt-7 w-full max-w-[270px] md:max-w-[310px]">
          <button
            onClick={() => setExpanding(true)}
            disabled={expanding}
            className="w-full font-medium tracking-widest text-white transition-all active:scale-[0.97]"
            style={{
              height: "54px",
              borderRadius: "9999px",
              fontSize: "clamp(14px, 3.8vw, 15px)",
              background: "linear-gradient(135deg, #e8923a 0%, #D97D3E 60%, #c96d2a 100%)",
              boxShadow: "0 8px 32px rgba(217,125,62,0.45), 0 2px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            ✦&nbsp; Get Started &nbsp;✦
          </button>
        </div>
        <p className="mt-4 text-[9px] uppercase tracking-[0.22em] text-white/20">
          For solo explorers · Tokyo
        </p>
      </motion.div>
    </div>
  );
}


function TealScreen({
  children, onNext, onBack, ctaLabel = "Continue", backLabel = "Back", stepPos,
}: {
  children: React.ReactNode;
  onNext: () => void; onBack: () => void;
  ctaLabel?: string; backLabel?: string;
  stepPos: number;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-secondary">
      <GesturalBackground />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col px-8 pt-12 pb-10">

        <div className="flex flex-col items-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Logo size="lg" dark />
          </motion.div>
          <motion.div
            className="flex gap-2 mt-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.18 }}
          >
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="rounded-full transition-all duration-500"
                style={{
                  width:  n === stepPos ? "18px" : "6px",
                  height: "6px",
                  background: n === stepPos ? "#D97D3E" : n < stepPos ? "rgba(217,125,62,0.35)" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </motion.div>
        </div>

        <div className="mt-10 flex-1 w-full">{children}</div>

        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.65 }}
        >
          <button
            onClick={onNext}
            className="w-full font-medium tracking-wide text-white transition-all active:scale-[0.97]"
            style={{
              height: "54px", borderRadius: "9999px", fontSize: "clamp(14px, 3.5vw, 15px)",
              background: "linear-gradient(135deg, #e8923a 0%, #D97D3E 60%, #c96d2a 100%)",
              boxShadow: "0 8px 32px rgba(217,125,62,0.4), 0 2px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
              letterSpacing: "0.04em",
            }}
          >
            {ctaLabel}
          </button>
          <button
            onClick={onBack}
            className="text-white/30 font-medium uppercase transition-colors hover:text-white/50"
            style={{ fontSize: "clamp(11px, 2.8vw, 13px)" }}
          >
            {backLabel}
          </button>
        </motion.div>
      </div>
    </div>
  );
}


function Screen1({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const points = [
    { stat: "Zero", detail: "rabbit holes down Google Maps" },
    { stat: "One",  detail: "place to find what fits you"   },
    { stat: "All",  detail: "the time back for the city"    },
  ];
  return (
    <TealScreen onNext={onNext} onBack={onBack} ctaLabel="Sounds good" backLabel="Back to home" stepPos={1}>
      <motion.div
        className="w-full text-left"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      >
        <p className="uppercase tracking-[0.2em] text-primary/70 mb-4" style={{ fontSize: "clamp(9px, 2vw, 11px)" }}>
          Why Novi
        </p>
        <h1
          className="font-display font-medium text-white mb-3"
          style={{ fontSize: "clamp(30px, 8vw, 42px)", letterSpacing: "-0.025em", lineHeight: 1.15 }}
        >
          Less searching,<br />
          <span className="text-primary">more experiencing.</span>
        </h1>
        <p className="text-white/45 mb-10" style={{ fontSize: "clamp(13px, 3.2vw, 15px)" }}>
          Solo travel loses hours to indecision. <br></br> Novi gives them back.
        </p>
        <div className="flex flex-col gap-5">
          {points.map((p, i) => (
            <motion.div
              key={i} className="flex items-center gap-5"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.55 + i * 0.18 }}
            >
              <span
                className="font-display font-medium text-primary shrink-0"
                style={{ fontSize: "clamp(22px, 6vw, 28px)", letterSpacing: "-0.02em", minWidth: "60px" }}
              >
                {p.stat}
              </span>
              <span className="text-white/50" style={{ fontSize: "14px", lineHeight: 1.4 }}>{p.detail}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </TealScreen>
  );
}


function Screen2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const items = [
    { allowed: true,  title: "Location while browsing", detail: "Only used to find nearby places. Never stored." },
    { allowed: true,  title: "Your taste preferences",  detail: "Kept on your device. You can reset anytime."    },
    { allowed: false, title: "Nothing else",            detail: "No account. No ads. No tracking."               },
  ];
  return (
    <TealScreen onNext={onNext} onBack={onBack} ctaLabel="Got it" stepPos={2}>
      <motion.div
        className="w-full text-left"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      >
        <p className="uppercase tracking-[0.2em] text-primary/70 mb-4" style={{ fontSize: "clamp(9px, 2vw, 11px)" }}>
          Your privacy
        </p>
        <h1
          className="font-display font-medium text-white mb-3"
          style={{ fontSize: "clamp(30px, 8vw, 42px)", letterSpacing: "-0.025em", lineHeight: 1.15 }}
        >
          Your location,<br />
          <span className="text-primary">your rules.</span>
        </h1>
        <p className="text-white/45 mb-8" style={{ fontSize: "clamp(13px, 3.2vw, 15px)" }}>
          Here's exactly what Novi uses, and what it doesn't.
        </p>
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-4 rounded-2xl px-4 py-3.5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.5 + i * 0.18 }}
            >
              <div
                className="shrink-0 mt-0.5 rounded-full flex items-center justify-center"
                style={{
                  width: "20px", height: "20px",
                  background: item.allowed ? "rgba(217,125,62,0.18)" : "rgba(255,255,255,0.08)",
                  border: `1px solid ${item.allowed ? "rgba(217,125,62,0.4)" : "rgba(255,255,255,0.12)"}`,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  {item.allowed
                    ? <path d="M2 5l2.5 2.5L8 3" stroke="#D97D3E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    : <path d="M3 3l4 4M7 3l-4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                  }
                </svg>
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.84)", lineHeight: 1.3, marginBottom: "2px" }}>
                  {item.title}
                </p>
                <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.38)", lineHeight: 1.4 }}>{item.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </TealScreen>
  );
}


function Screen3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const steps = [
    { label: "Dietary", hint: "Any restrictions?"    },
    { label: "Budget",  hint: "Your comfort zone"    },
    { label: "Vibe",    hint: "What you enjoy doing"  },
  ];
  const ROW_H    = 72;
  const CIRCLE   = 24;
  const COL_W    = 28;
  const DOT_TOP  = (ROW_H - CIRCLE) / 2;
  const LINE_TOP = DOT_TOP + CIRCLE;
  const LINE_H   = ROW_H - CIRCLE;

  return (
    <TealScreen onNext={onNext} onBack={onBack} ctaLabel="Let's do it" stepPos={3}>
      <motion.div
        className="w-full text-left"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      >
        <p className="uppercase tracking-[0.2em] text-primary/70 mb-4" style={{ fontSize: "clamp(9px, 2vw, 11px)" }}>
          Almost there
        </p>
        <h1
          className="font-display font-medium text-white mb-3"
          style={{ fontSize: "clamp(30px, 8vw, 42px)", letterSpacing: "-0.025em", lineHeight: 1.15 }}
        >
          Let's make it<br />
          <span className="text-primary">personal.</span>
        </h1>
        <p className="text-white/45 mb-12" style={{ fontSize: "clamp(13px, 3.2vw, 15px)" }}>
          Three quick questions. Thirty seconds. Tokyo, your way.
        </p>

        <div className="relative" style={{ height: `${steps.length * ROW_H}px` }}>
          {steps.slice(0, -1).map((_, i) => (
            <motion.div
              key={`line-${i}`}
              style={{
                position: "absolute",
                left: `${COL_W / 2 - 0.5}px`,
                top:  `${i * ROW_H + LINE_TOP}px`,
                width: "1px", height: `${LINE_H}px`,
                background: "rgba(217,125,62,0.22)",
                transformOrigin: "top",
              }}
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.65 + i * 0.2 }}
            />
          ))}
          {steps.map((s, i) => (
            <motion.div
              key={i}
              className="absolute flex items-center gap-4"
              style={{ top: `${i * ROW_H}px`, height: `${ROW_H}px`, width: "100%" }}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.5 + i * 0.18 }}
            >
              <div
                className="shrink-0 flex items-center justify-center rounded-full font-medium"
                style={{
                  width: `${CIRCLE}px`, height: `${CIRCLE}px`,
                  background: "rgba(217,125,62,0.14)", border: "1px solid rgba(217,125,62,0.32)",
                  fontSize: "11px", color: "#D97D3E", marginLeft: `${(COL_W - CIRCLE) / 2}px`,
                }}
              >
                {i + 1}
              </div>
              <div>
                <p style={{ fontSize: "15px", fontWeight: 500, color: "rgba(255,255,255,0.84)", lineHeight: 1.2, marginBottom: "4px" }}>
                  {s.label}
                </p>
                <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.38)", lineHeight: 1.3 }}>{s.hint}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </TealScreen>
  );
}


function SelectionRow({ label, sub, description, selected, onClick }: {
  label: string; sub?: string; description?: string; selected: boolean; onClick: () => void;
}) {
  const subtitle = sub ?? description ?? "";
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all
        ${selected ? "bg-secondary text-white border-secondary" : "bg-white border-secondary/10 text-secondary"}`}
    >
      <div className="text-left">
        <p className="font-semibold" style={{ fontSize: "clamp(13px, 3.5vw, 15px)" }}>{label}</p>
        <p className={selected ? "text-white/60" : "text-secondary/40"} style={{ fontSize: "clamp(11px, 2.8vw, 12px)" }}>
          {subtitle}
        </p>
      </div>
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ml-3
        ${selected ? "bg-primary border-primary" : "border-secondary/20"}`}>
        {selected && <span className="text-[10px] text-white">✓</span>}
      </div>
    </button>
  );
}

function BudgetTile({ symbol, label, selected, onClick }: {
  symbol: string; label: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-6 rounded-2xl border transition-all
        ${selected ? "bg-secondary border-secondary text-white" : "bg-white border-secondary/10 text-secondary"}`}
    >
      <span className="text-xl font-bold mb-1 text-primary">{symbol}</span>
      <span className="font-medium text-center px-1" style={{ fontSize: "clamp(11px, 2.8vw, 13px)" }}>{label}</span>
    </button>
  );
}


export default function OnboardingPage() {
  const router = useRouter();

  const [stepIndex, setStepIndex]         = React.useState(-4);
  const [isSubmitting, setIsSubmitting]   = React.useState(false);
  const [data, setData]                   = React.useState<OnboardingData>({ dietary: [], budget: 2, activity: [] });
  const [stepStartTime, setStepStartTime] = React.useState(Date.now());
  const [onboardingStartTime]             = React.useState(Date.now());

  React.useEffect(() => {
    const userId = localStorage.getItem("novi_user_id");
    if (!userId) trackOnboardingStarted();
  }, []);

  React.useEffect(() => {
    const userId = localStorage.getItem("novi_user_id");
    if (userId) router.replace("/recommendations");
  }, [router]);

  const step   = stepIndex >= 0 ? PREF_STEPS[stepIndex] : null;
  const isLast = stepIndex === PREF_STEPS.length - 1;

  const toggleDietary = (val: string) => {
    setData(prev => {
      let next = [...prev.dietary];
      if (val === "none") { next = ["none"]; }
      else {
        next = next.filter(i => i !== "none");
        if (next.includes(val)) next = next.filter(i => i !== val);
        else next.push(val);
      }
      return { ...prev, dietary: next };
    });
  };

  const toggleActivity = (val: string) => {
    setData(prev => ({
      ...prev,
      activity: prev.activity.includes(val)
        ? prev.activity.filter(v => v !== val)
        : [...prev.activity, val],
    }));
  };

  const handleBack = () => {
    if      (stepIndex > 0)        setStepIndex(i => i - 1);
    else if (stepIndex === 0)      setStepIndex(-1);
    else if (stepIndex > -4)       setStepIndex(i => i - 1);
    // stepIndex === -4 is home — no back button rendered
  };

  const handleNext = () => {
    const stepName   = (["dietary", "budget", "activity"] as const)[stepIndex];
    const selections = stepIndex === 0 ? data.dietary : stepIndex === 1 ? data.budget : data.activity;
    const timeOnStep = Math.round((Date.now() - stepStartTime) / 1000);
    trackOnboardingStepCompleted(stepIndex + 1, stepName, selections, timeOnStep);
    if (isLast) { handleSubmit(); }
    else        { setStepIndex(i => i + 1); setStepStartTime(Date.now()); }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {
            dietary: data.dietary,
            budget: data.budget,
            activity_preference: data.activity,
          },
        }),
      });
      if (!response.ok) throw new Error("Onboarding failed");
      const result = await response.json();
      localStorage.setItem("novi_user_id", result.user_id);
      identifyUser(result.user_id, {
        dietary: data.dietary, budget: data.budget, activities: data.activity,
        signup_date: new Date().toISOString(), device_type: getDeviceType(),
      });
      const totalTime = Math.round((Date.now() - onboardingStartTime) / 1000);
      trackOnboardingCompleted(totalTime, data.dietary, data.budget, data.activity);
      router.replace("/recommendations");
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const isNextDisabled =
    (stepIndex === 0 && data.dietary.length === 0) ||
    (stepIndex === 1 && !data.budget) ||
    (stepIndex === 2 && data.activity.length === 0);

  /* ── HOME ── */
  if (stepIndex === -4) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-secondary">
        <HomeScreen onEnter={() => setStepIndex(-3)} />
      </div>
    );
  }

  /* ── TEAL INFO SCREENS ── */
  if (stepIndex < 0) {
    const advance = () => setStepIndex(i => i + 1);
    return (
      <div className="h-[100dvh] overflow-hidden bg-secondary">
        <AnimatePresence mode="wait" initial={false}>
          {stepIndex === -3 && (
            <motion.div key="s1" className="h-full"
              initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Screen1 onNext={advance} onBack={() => setStepIndex(-4)} />
            </motion.div>
          )}
          {stepIndex === -2 && (
            <motion.div key="s2" className="h-full"
              initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Screen2 onNext={advance} onBack={() => setStepIndex(-3)} />
            </motion.div>
          )}
          {stepIndex === -1 && (
            <motion.div key="s3" className="h-full"
              initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Screen3
                onNext={() => { setStepIndex(0); setStepStartTime(Date.now()); }}
                onBack={() => setStepIndex(-2)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ── PREFERENCE STEPS ── */
  return (
    <div className="h-[100dvh] flex flex-col bg-cream overflow-hidden">

      <header className="flex-shrink-0 pt-12 pb-6 px-7 border-b border-secondary/[0.04]">
        <div className="flex items-center justify-between mb-8 h-10">
          <Logo size="md" />
          <div className="bg-secondary/5 border border-secondary/10 px-3 py-1.5 rounded-full flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span className="font-bold uppercase tracking-widest text-secondary" style={{ fontSize: "clamp(9px, 2vw, 10px)" }}>
              {step!.label}
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 mb-6">
          {PREF_STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-secondary/10 overflow-hidden">
              <div className={`h-full bg-secondary transition-all duration-500 ease-out ${i <= stepIndex ? "w-full" : "w-0"}`} />
            </div>
          ))}
        </div>
        <div>
          <h1 className="font-display font-semibold text-secondary leading-tight tracking-tight mb-2"
            style={{ fontSize: "clamp(26px, 7vw, 32px)" }}>
            {step!.question}
          </h1>
          <p className="text-secondary/50 font-light italic" style={{ fontSize: "clamp(13px, 3.5vw, 15px)" }}>
            {step!.hint}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-7 py-3" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 max-w-md mx-auto"
          >
            {stepIndex === 0 && DIETARY.map(opt => (
              <SelectionRow key={opt.value} label={opt.label} sub={opt.sub}
                selected={data.dietary.includes(opt.value)} onClick={() => toggleDietary(opt.value)} />
            ))}
            {stepIndex === 1 && (
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                {BUDGET.map(opt => (
                  <BudgetTile key={opt.value} symbol={opt.symbol} label={opt.label}
                    selected={data.budget === opt.value} onClick={() => setData(d => ({ ...d, budget: opt.value }))} />
                ))}
              </div>
            )}
            {stepIndex === 2 && ACTIVITY.map(opt => (
              <SelectionRow key={opt.value} label={opt.label} description={opt.description}
                selected={data.activity.includes(opt.value)} onClick={() => toggleActivity(opt.value)} />
            ))}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="flex-shrink-0 bg-cream border-t border-secondary/[0.04] px-7 pt-5 pb-8">
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <Button variant="primary" size="lg" fullWidth onClick={handleNext}
            loading={isSubmitting} disabled={isNextDisabled}
            className="rounded-full shadow-lg !h-14 !text-base text-cream shadow-primary/10">
            {isLast ? "Create My Journey" : "Continue"}
          </Button>
          <button onClick={handleBack} className="py-2 text-center text-secondary/40 font-medium uppercase"
            style={{ fontSize: "clamp(11px, 2.8vw, 13px)" }}>
            {stepIndex === 0 ? "Back" : "Go Back"}
          </button>
        </div>
      </footer>

    </div>
  );
}
