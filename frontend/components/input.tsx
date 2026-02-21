import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  variant?: "default" | "search";
}

/**
 * Novi Base Input
 * Production-ready with forwardRef, useId, accessibility
 * Large touch targets and clean labels
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className = "",
      id,
      icon,
      iconPosition = "left",
      variant = "default",
      ...props
    },
    ref
  ) => {
    // Use React 18 useId for guaranteed unique IDs
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const variantStyles = {
      default: "bg-gray-50/50 border-gray-200",
      search: "bg-gray-100 border-gray-300 rounded-full",
    };

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="ml-1 text-sm font-semibold text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && iconPosition === "left" && (
            <span className="absolute left-4 flex items-center justify-center text-gray-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              flex h-14 w-full rounded-2xl border transition-all placeholder:text-gray-400
              focus:outline-none focus:ring-4
              disabled:cursor-not-allowed disabled:opacity-50
              ${variantStyles[variant]}
              ${icon && iconPosition === "left" ? "pl-12" : "px-4"}
              ${icon && iconPosition === "right" ? "pr-12" : ""}
              ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                  : "focus:border-[#FF8904] focus:ring-[#FF8904]/15"
              }
              ${className}
            `}
            aria-invalid={error ? true : false}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <span className="absolute right-4 flex items-center justify-center text-gray-400">
              {icon}
            </span>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="ml-1 text-xs font-medium text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
