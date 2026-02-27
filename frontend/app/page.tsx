"use client"

import Link from "next/link";
import { Button } from "../components/button";
import { Logo } from "../components/logo";

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes zoom-out {
          from { transform: scale(1.42); }
          to   { transform: scale(1.00); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .animate-zoom-out {
          animation: zoom-out 5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .animate-fade-up {
          opacity: 0;
          animation: fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.8s forwards;
        }
        .animate-fade-in {
          opacity: 0;
          animation: fade-in 1s ease 0.3s forwards;
        }
      `}</style>

      <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0d1f22] font-sans">

        {/* ── Background Image: Full Bleed, Ken Burns zoom-out ── */}
        <div
          className="absolute inset-0 z-0 bg-cover animate-zoom-out"
          style={{
            backgroundImage: `url(https://img.freepik.com/premium-photo/beautiful-landscape-mountain-fuji-with-chureito-pagoda-around-maple-leaf-tree-autumn_1203-12814.jpg?semt=ais_user_personalization&w=740&q=80)`,
            backgroundPosition: "95% center",
          }}
        />

        {/* ── Gradient Overlay: radial bloom from bottom, dissolves image into dark base ── */}
        {/* Layer 1: top-down light scrim so the logo area stays readable */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(13,31,34,0.30) 0%, transparent 30%)",
          }}
        />
        {/* Layer 2: bottom vignette — radial that blooms from base center */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `
              radial-gradient(
                ellipse 120% 70% at 50% 110%,
                #0d1f22 0%,
                #0d1f22 28%,
                rgba(13,31,34,0.85) 48%,
                rgba(13,31,34,0.45) 62%,
                transparent 78%
              )
            `,
          }}
        />

        {/* ── Top Section: Logo ── */}
        <div className="relative z-20 flex flex-col items-center pt-10 px-7 text-center animate-fade-in">
          <Logo size="lg" />
        </div>


        {/* ── Bottom Section: Text + CTA anchored to base ── */}
        <div className="absolute inset-x-0 bottom-0 z-30 px-7 pb-12 flex flex-col items-center text-center animate-fade-up">

          {/* Motto */}
          <h2
            className="font-display text-[34px] md:text-[42px] lg:text-[48px] font-medium text-white"
            style={{
              textShadow: `
                0 0 40px rgba(0,0,0,0.9),
                0 2px 8px rgba(0,0,0,0.8),
                0 4px 24px rgba(0,0,0,0.6)
              `,
            }}
          >
            Keep the wonder, lose the worry.
          </h2>

          {/* Supporting sentence */}
          <p
            className="mt-4 text-[15px] md:text-[18px] lg:text-[28px] leading-relaxed"
            style={{ color: "rgba(255, 255, 255, 0.82)", textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}
          >
            From sunrise temples to midnight snacks, every stop already vetted. All that's left is to enjoy.
          </p>

          {/* CTA */}
          <div className="mt-8 w-full max-w-xs">
            {/* <Link href="/onboarding"> */}
              <Button
                className="w-full !h-14 lg:!h-16 rounded-full bg-[#AD2062] text-white shadow-xl shadow-[#AD2062]/30 !text-[16px] lg:!text-[20px] font-medium transition-all active:scale-[0.97]"
              >
                ✦&nbsp; Start your curation &nbsp;✦
              </Button>
            {/* </Link> */}
          </div>

        </div>

      </div>
    </>
  );
}
