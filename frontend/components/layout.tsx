import * as React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Novi Base Layout
 * Simple container with responsive max width
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, size = "lg", className = "", ...props }, ref) => {
    const sizes = {
      sm: "max-w-3xl",
      md: "max-w-5xl",
      lg: "max-w-6xl",
      xl: "max-w-7xl",
    };

    return (
      <div
        ref={ref}
        className={`mx-auto w-full px-6 ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * Simple vertical stack helper
 */
export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ children, gap = "md", className = "", ...props }, ref) => {
    const gaps = {
      xs: "gap-2",
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-8",
      xl: "gap-10",
    };

    return (
      <div
        ref={ref}
        className={`flex flex-col ${gaps[gap]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Stack.displayName = "Stack";
