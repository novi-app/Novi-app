import * as React from "react";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md" | "lg";
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeStyles = {
  sm: "h-10 px-3 text-sm",
  md: "h-12 px-4 text-base",
  lg: "h-14 px-5 text-lg",
};

const iconPaddingLeft = {
  sm: "pl-9",
  md: "pl-11",
  lg: "pl-12",
};

const iconPaddingRight = {
  sm: "pr-9",
  md: "pr-11",
  lg: "pr-12",
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = "md",
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id,
      className = "",
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col w-full gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            aria-describedby={helperText || error ? helperId : undefined}
            className={`
              w-full rounded-pill border bg-white text-neutral-900
              placeholder:text-neutral-400
              focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
              ${hasError
                ? "border-error focus:ring-error/40"
                : "border-neutral-300 focus:ring-primary/50 focus:border-primary"
              }
              ${sizeStyles[size]}
              ${leftIcon ? iconPaddingLeft[size] : ""}
              ${rightIcon ? iconPaddingRight[size] : ""}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>

        {(error || helperText) && (
          <p
            id={helperId}
            className={`text-xs ${hasError ? "text-error" : "text-neutral-500"}`}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
