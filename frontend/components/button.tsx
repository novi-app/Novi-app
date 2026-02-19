import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "text";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

/**
 * Novi Base Button
 * Production-ready with theme tokens, accessibility, and flexibility
 * Optimized for mobile touch targets (min 44px for default/lg)
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading,
      icon,
      iconPosition = "left",
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-gradient-to-r from-[#FF8904] to-[#FF6900] text-white shadow-lg hover:shadow-xl hover:from-[#FF8904]/90 hover:to-[#FF6900]/90",
      secondary:
        "bg-gradient-to-r from-[#05DF72] to-[#00C950] text-white shadow-md hover:shadow-lg hover:from-[#05DF72]/90 hover:to-[#00C950]/90",
      outline:
        "border-2 border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
      text: "bg-transparent text-[#FF8904] hover:text-[#FF6900]",
    };

    const sizes = {
      xs: "h-8 px-3 text-xs",
      sm: "h-10 px-4 text-sm",
      md: "h-12 px-6 text-base",
      lg: "h-14 px-8 text-lg",
      icon: "h-11 w-11",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
          fullWidth ? "w-full" : ""
        } ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className="flex items-center justify-center gap-2">
          {iconPosition === "left" && icon && !isLoading && (
            <span className="flex items-center justify-center">{icon}</span>
          )}
          {isLoading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {children}
          {iconPosition === "right" && icon && !isLoading && (
            <span className="flex items-center justify-center">{icon}</span>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";
