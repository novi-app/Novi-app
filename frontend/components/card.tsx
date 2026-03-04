import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "float";
  padding?: "none" | "sm" | "md" | "lg";
}

type CardSubComponents = {
  Title: React.FC<{ children: React.ReactNode; className?: string }>;
  Content: React.FC<{ children: React.ReactNode; className?: string }>;
  Footer: React.FC<{ children: React.ReactNode; className?: string }>;
};

const variantStyles = {
  default:  "bg-white shadow-xs border border-secondary/[0.06]",
  elevated: "bg-white shadow-md",
  float:    "bg-white shadow-float",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};


const CardComponent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = "default", padding = "md", className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardComponent.displayName = "Card";

// Type cast to add subcomponents
export const Card = CardComponent as typeof CardComponent & CardSubComponents;

Card.Title = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-neutral-900 ${className}`}>
    {children}
  </h3>
);
Card.Title.displayName = "Card.Title";

Card.Content = ({ children, className = "" }) => (
  <div className={`mt-2 text-sm text-neutral-600 leading-relaxed ${className}`}>
    {children}
  </div>
);
Card.Content.displayName = "Card.Content";

Card.Footer = ({ children, className = "" }) => (
  <div className={`mt-4 pt-4 border-t border-neutral-100 ${className}`}>
    {children}
  </div>
);
Card.Footer.displayName = "Card.Footer";
