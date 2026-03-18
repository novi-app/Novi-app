"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function FinishPage() {
  const router = useRouter();

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">

      <div className="absolute inset-0">
        <Image
          src="/intro3.jpg"
          alt="Tokyo awaits"
          fill
          className="object-cover object-top"
          priority
        />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col px-7"
        style={{ top: "50dvh", paddingTop: "3dvh", paddingBottom: "6dvh", gap: "2dvh" }}
      >
        <div>
          <p
            className="font-display font-semibold text-black leading-tight"
            style={{
              fontSize: "clamp(34px, 8.5vw, 50px)",
              letterSpacing: "-0.02em",
              paddingLeft: "2dvh",
              textShadow: "0 4px 4px rgba(0,0,0,0.25)",
            }}
          >
            Tokyo
          </p>
          <p
            className="font-display font-semibold leading-tight"
            style={{
              fontSize: "clamp(34px, 8.5vw, 50px)",
              letterSpacing: "-0.02em",
              color: "#E8700A",
              paddingLeft: "4dvh",
            }}
          >
            awaits.
          </p>
        </div>

        <p
          className="font-bold text-black"
          style={{ fontSize: "clamp(18px, 6vw, 30px)" }}
        >
          You're all set
        </p>

        <p
          className="text-neutral-500 leading-relaxed flex-1"
          style={{ fontSize: "clamp(15px, 4vw, 22px)" }}
        >
          You handle the adventure. We'll handle the choice.
        </p>

        <button
          onClick={() => router.replace("/tabs/home")}
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
          Ready to explore
        </button>
      </div>

    </div>
  );
}
