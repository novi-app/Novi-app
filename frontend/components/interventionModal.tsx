"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";


interface InterventionModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onAccept: () => void;
  level: "GENTLE" | "MODERATE" | "URGENT";
  message: string;
  suggestedAction: string;
  venue: {
    id: string;
    name: string;
    photo?: string;
    category: string;
  };
}

function triggerHaptic(style: "light" | "medium" | "heavy" = "medium") {
  if (typeof window === "undefined") return;
  
  // iOS Haptic Feedback (Safari/Chrome on iOS)
  if ("vibrate" in navigator) {
    const patterns = {
      light: [50],
      medium: [100, 50, 100],
      heavy: [150, 50, 150, 50, 150],
    };
    navigator.vibrate(patterns[style]);
  }
  
  // PWA Haptic Feedback (if supported)
  if ("HapticsEngine" in window) {
    (window as any).HapticsEngine?.impact(style);
  }
}

const levelConfig = {
  GENTLE: {
    icon: "💭",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    accentColor: "#3B82F6",
    backdrop: "bg-black/30",
  },
  MODERATE: {
    icon: "🤔",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    accentColor: "#F59E0B",
    backdrop: "bg-black/40",
  },
  URGENT: {
    icon: "✨",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    accentColor: "#D97D3E",
    backdrop: "bg-black/50",
  },
};


export function InterventionModal({
  isOpen,
  onDismiss,
  onAccept,
  level,
  message,
  suggestedAction,
  venue,
}: InterventionModalProps) {
  const config = levelConfig[level];
  const [isExiting, setIsExiting] = React.useState(false);

  // Haptic on open
  React.useEffect(() => {
    if (isOpen) {
      const hapticStyle = level === "GENTLE" ? "light" : level === "MODERATE" ? "medium" : "heavy";
      triggerHaptic(hapticStyle);
    }
  }, [isOpen, level]);

  // Lock scroll
  React.useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  const handleDismiss = () => {
    triggerHaptic("light");
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
      setIsExiting(false);
    }, 300);
  };

  const handleAccept = () => {
    triggerHaptic("heavy");
    onAccept();
  };

  // ESC to dismiss
  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  if (!isOpen && !isExiting) return null;

  const content = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed inset-0 backdrop-blur-sm ${config.backdrop}`}
            onClick={handleDismiss}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 sm:mx-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle (mobile) */}
            <div className="mx-auto mt-3 mb-2 h-1 w-12 rounded-full bg-neutral-200 sm:hidden" />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Venue Photo */}
            {venue.photo && (
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={venue.photo}
                  alt={venue.name}
                  className="h-full w-full object-cover"
                />
                {/* Gradient overlay */}
                <div 
                  className="absolute inset-0" 
                  style={{ 
                    background: `linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.9) 100%)` 
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div className="px-6 pb-6" style={{ marginTop: venue.photo ? "-2rem" : "1rem" }}>
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div 
                  className={`flex h-16 w-16 items-center justify-center rounded-full ${config.iconBg} text-3xl`}
                  style={{ boxShadow: `0 4px 20px ${config.accentColor}20` }}
                >
                  {config.icon}
                </div>
              </div>

              {/* Message */}
              <h2 className="text-center text-xl font-bold text-secondary mb-4 leading-snug px-2">
                {message}
              </h2>

              {/* Actions */}
              <div className="space-y-3">
                {/* Primary: Accept */}
                <button
                  onClick={handleAccept}
                  className="w-full h-14 rounded-full font-semibold text-white transition-all active:scale-[0.97]"
                  style={{
                    background: `linear-gradient(135deg, ${config.accentColor} 0%, ${config.accentColor}dd 100%)`,
                    boxShadow: `0 8px 24px ${config.accentColor}40`,
                  }}
                >
                  Let's Go
                </button>

                {/* Secondary: Dismiss */}
                <button
                  onClick={handleDismiss}
                  className="w-full h-12 rounded-full font-medium text-secondary/60 hover:bg-secondary/5 transition-colors"
                >
                  Keep Browsing
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
