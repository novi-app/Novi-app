import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass";
}

/**
 * Novi Base Card
 * Production-ready with variant support
 * Mobile-first with optional glassmorphism
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = "default", className = "", ...props }, ref) => {
    const variants = {
      default:
        "bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow",
      glass:
        "bg-white/80 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-shadow",
    };

    return (
      <div
        ref={ref}
        className={`
          relative overflow-hidden rounded-3xl
          ${variants[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = "", image, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative overflow-hidden ${image ? "aspect-video" : "p-5"} ${className}`}
        {...props}
      >
        {image || children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={`p-5 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={`px-5 pb-5 flex gap-3 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";
