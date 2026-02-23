import * as React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeStyles = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  label = "Loading…",
  className = "",
}) => (
  <div role="status" className={`inline-flex flex-col items-center gap-2 ${className}`}>
    <span
      className={`
        block rounded-full border-primary/20 border-t-primary animate-spin
        ${sizeStyles[size]}
      `}
      aria-hidden="true"
    />
    <span className="sr-only">{label}</span>
  </div>
);

Spinner.displayName = "Spinner";
