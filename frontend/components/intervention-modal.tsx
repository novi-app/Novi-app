import * as React from "react";
import { createPortal } from "react-dom";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface InterventionAction {
  /** Button label (e.g. "Show Top Pick") */
  label: string;
  /** Visual style of the button */
  variant?: "primary" | "secondary" | "ghost";
  /** Callback fired when the button is pressed */
  onClick: () => void;
}

interface InterventionModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the user dismisses the modal (backdrop click, ESC, or X) */
  onDismiss: () => void;
  /** Primary intervention message displayed to the user */
  message: string;
  /** Optional secondary / explanatory text below the message */
  description?: string;
  /** Action buttons rendered at the bottom of the modal */
  actions?: InterventionAction[];
  /** Optional icon rendered above the message */
  icon?: React.ReactNode;
  /** Auto-dismiss after N milliseconds (0 = never) */
  autoDismissMs?: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Keep in sync with the Tailwind `duration-300` class used below. */
const ANIMATION_DURATION = 300;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const actionVariantStyles: Record<
  NonNullable<InterventionAction["variant"]>,
  string
> = {
  primary:
    "bg-primary text-primary-contrast hover:bg-primary-strong active:bg-primary-strong focus-visible:ring-primary/50 shadow-xs",
  secondary:
    "bg-secondary text-secondary-contrast hover:bg-secondary-strong active:bg-secondary-strong focus-visible:ring-secondary/50 shadow-xs",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-neutral-400/50",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const InterventionModal: React.FC<InterventionModalProps> = ({
  isOpen,
  onDismiss,
  message,
  description,
  actions = [],
  icon,
  autoDismissMs = 0,
}) => {
  const [phase, setPhase] = React.useState<"entering" | "visible" | "exiting">(
    "entering"
  );
  const dialogRef = React.useRef<HTMLDivElement>(null);

  /* ---------- Animate in on open ---------- */
  React.useEffect(() => {
    if (isOpen) {
      // Start in "entering" so the first frame has off-screen styles
      setPhase("entering");
      // Next frame → slide up
      const raf = requestAnimationFrame(() => setPhase("visible"));
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen]);

  /* ---------- Auto-focus dialog for accessibility ---------- */
  React.useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  /* ---------- ESC key ---------- */
  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ---------- Lock body scroll ---------- */
  React.useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  /* ---------- Auto-dismiss ---------- */
  React.useEffect(() => {
    if (!isOpen || autoDismissMs <= 0) return;
    const timer = setTimeout(() => handleDismiss(), autoDismissMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoDismissMs]);

  /* ---------- Dismiss with exit animation ---------- */
  const handleDismiss = React.useCallback(() => {
    setPhase("exiting");
    // Wait for the exit animation to finish, then notify parent
    setTimeout(() => {
      onDismiss();
    }, ANIMATION_DURATION);
  }, [onDismiss]);

  /* ---------- Bail if closed ---------- */
  if (!isOpen && phase !== "exiting") return null;

  /* ---------- Transition classes ---------- */
  const backdropClass =
    phase === "visible"
      ? "opacity-100"
      : phase === "exiting"
        ? "opacity-0"
        : "opacity-0";

  const panelClass =
    phase === "visible"
      ? "translate-y-0 opacity-100"
      : phase === "exiting"
        ? "translate-y-full opacity-0"
        : "translate-y-full opacity-0";

  /* ---------- Render ---------- */
  const content = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/40 backdrop-blur-sm
          transition-opacity duration-300 ease-out
          ${backdropClass}
        `}
        onClick={handleDismiss}
        role="presentation"
        aria-hidden="true"
      />

      {/* Panel – slides up from the bottom */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={message}
        onClick={(e) => e.stopPropagation()}
        className={`
          relative w-full max-w-md mx-4 sm:mx-auto
          rounded-t-2xl sm:rounded-2xl
          bg-white p-6 shadow-xl outline-none
          transition-all duration-300 ease-out
          ${panelClass}
        `}
      >
        {/* Mobile drag handle */}
        <div
          className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-200 sm:hidden"
          aria-hidden="true"
        />

        {/* Close / dismiss button */}
        <button
          onClick={handleDismiss}
          type="button"
          aria-label="Dismiss intervention"
          className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center pt-2">
          {/* Icon */}
          {icon && (
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              {icon}
            </div>
          )}

          {/* Message */}
          <h2 className="text-xl font-bold text-neutral-900 mb-2 pr-6 pl-6">
            {message}
          </h2>

          {/* Description */}
          {description && (
            <p className="text-sm text-neutral-500 mb-6 max-w-xs">
              {description}
            </p>
          )}

          {/* Action buttons */}
          {actions.length > 0 && (
            <div className="flex w-full flex-col gap-3 mt-2">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={action.onClick}
                  className={`
                    inline-flex items-center justify-center font-semibold
                    h-12 px-5 text-base rounded-xl
                    transition-colors duration-150 ease-in-out
                    focus-visible:outline-none focus-visible:ring-2
                    ${actionVariantStyles[action.variant ?? (idx === 0 ? "primary" : "ghost")]}
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : null;
};

InterventionModal.displayName = "InterventionModal";
