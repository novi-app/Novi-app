import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "outline" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
}

/**
 * Novi Base Badge/Tag
 * Reusable for status, filters, tags, and interactive chips
 * Supports theme tokens for scalability
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      onClick,
      className = "",
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: "bg-[#FF8904]/15 text-[#FF8904]",
      secondary: "bg-[#05DF72]/15 text-[#05DF72]",
      outline: "border border-gray-300 bg-white text-gray-700",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      danger: "bg-red-100 text-red-800",
    };

    const sizes = {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-1.5 text-xs",
    };

    return (
      <span
        ref={ref}
        onClick={onClick}
        className={`
          inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide
          ${variants[variant]}
          ${sizes[size]}
          ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
          ${className}
        `}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick(e as any);
                }
              }
            : undefined
        }
        {...props}
      >
        {icon && <span className="flex items-center justify-center">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
