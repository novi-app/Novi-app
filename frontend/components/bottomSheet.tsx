import * as React from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Prevent closing when clicking the backdrop */
  dismissible?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  dismissible = true,
}) => {
  // ESC key support
  React.useEffect(() => {
    if (!isOpen || !dismissible) return;
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, dismissible, onClose]);

  // Lock body scroll
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

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
        role="presentation"
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "bottom-sheet-title" : undefined}
        className="relative w-full rounded-t-sheet bg-white p-6 shadow-xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Drag handle */}
        <div
          className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-neutral-200"
          aria-hidden="true"
        />

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2
              id="bottom-sheet-title"
              className="text-xl font-bold text-neutral-900"
            >
              {title}
            </h2>
          )}
          {dismissible && (
            <button
              onClick={onClose}
              className="ml-auto rounded-full p-2 text-neutral-400 hover:bg-neutral-100 transition-colors"
              aria-label="Close"
              type="button"
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
          )}
        </div>

        {children}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : null;
};

BottomSheet.displayName = "BottomSheet";
