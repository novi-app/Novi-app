"use client";

import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { useRef } from "react";
import globeAnimation from "@/public/spinning-globe.json";

export function SpinningGlobe({ size = 68, className = "" }: { size?: number; className?: string }) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={globeAnimation}
        loop
        autoplay
        onDOMLoaded={() => lottieRef.current?.setSpeed(1.5)}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
