import * as React from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnEsc?: boolean;
  closeOnBackdropClick?: boolean;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnEsc = true,
  closeOnBackdropClick = true,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  // ESC key
  React.useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

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

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeOnBackdropClick ? onClose : undefined}
        role="presentation"
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={`
          relative w-full ${sizes[size]}
          rounded-t-2xl sm:rounded-2xl
          bg-white p-6 shadow-xl
          animate-in slide-in-from-bottom duration-300
        `}
      >
        {/* Mobile drag handle */}
        <div
          className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-neutral-200 sm:hidden"
          aria-hidden="true"
        />

        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
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

        {/* Title */}
        {title && (
          <h2
            id="modal-title"
            className="text-2xl font-bold text-neutral-900 mb-1 pr-8"
          >
            {title}
          </h2>
        )}

        <div className={title ? "mt-4" : ""}>{children}</div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

Modal.displayName = "Modal";
