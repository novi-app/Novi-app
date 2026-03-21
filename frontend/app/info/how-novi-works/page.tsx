"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HowNoviWorksPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-cream">
      <div
        className="bg-secondary text-white px-6 py-2 flex flex-col gap-1"
        style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)", height: "140px" }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-2xl font-bold">How Novi Works</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Intro */}
        <p className="text-black text-base leading-relaxed">
          Novi is your travel companion — built to cut through the noise and <strong>get you somewhere great, faster</strong>
        </p>

        <hr className="border-black" />

        {/* Hero image */}
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: "260px" }}>
          <Image
            src="/profile-how-novi-works.png"
            alt="Novi in action"
            fill
            className="object-cover"
          />
        </div>

        <div>
          <p className="font-bold text-black text-base mb-1">Set up your profile, once</p>
          <p className="text-black text-base leading-relaxed">
            Tell Novi your food preferences, activity interests, and budget when you sign up.
            The more it knows upfront, the better your recommendations from day one.
          </p>
        </div>

        <hr className="border-cream" />

        <div>
          <p className="font-bold text-black text-base mb-1">Tell Novi what you’re in the mood for</p>
          <p className="text-black text-base leading-relaxed">
            Each time you open the app, three quick questions reveal one by one — what you’re after, the vibe you’re feeling, and what the moment calls for. Answer them and Novi gets to work. Or skip it all and hit <strong>Let Novi Decide</strong> right from the start.
          </p>
        </div>

        <hr className="border-cream" />

        <div>
          <p className="font-bold text-black text-base mb-1">Get suggestions made for you</p>
          <p className="text-black text-base leading-relaxed">
            Novi gives you three personalized recommendations — with one hero suggestion at the top. No need for endless scrolling.
          </p>
        </div>

        <hr className="border-cream" />

        <div>
          <p className="font-bold text-black text-base mb-1">Still unsure? Novi steps in</p>
          <p className="text-black text-base leading-relaxed">
            If you’re going back and forth, Novi notices and gently intervenes with one strong recommendation to get you moving.
          </p>
        </div>


        <hr className="border-cream" />

        <div>
          <p className="font-bold text-black text-base mb-1">The more you use it, the better it gets</p>
          <p className="text-black text-base leading-relaxed">
            Every session teaches Novi a little more about how you travel. Over time, recommendations get sharper — and feel less like suggestions, more like someone who actually knows you.
          </p>
        </div>

        <hr className="border-cream" />
        <hr className="border-cream" />

      </div>
    </div>
  );
}
