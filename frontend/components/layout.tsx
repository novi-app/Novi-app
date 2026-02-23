import * as React from "react";

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const containerSizes = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

/**
 * Responsive max-width page wrapper with horizontal padding.
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, size = "lg", className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`mx-auto w-full px-4 sm:px-6 ${containerSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
Container.displayName = "Container";

// ---------------------------------------------------------------------------
// Stack (vertical)
// ---------------------------------------------------------------------------

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
}

const stackGaps = {
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-10",
};

const alignItems = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

/**
 * Vertical flex layout with configurable gap and alignment.
 */
export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ children, gap = "md", align = "stretch", className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col ${stackGaps[gap]} ${alignItems[align]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
Stack.displayName = "Stack";

// ---------------------------------------------------------------------------
// Row (horizontal)
// ---------------------------------------------------------------------------

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
}

const rowGaps = {
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const justifyContent = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

const alignRow = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
};

/**
 * Horizontal flex layout with configurable gap, alignment, and justify.
 */
export const Row = React.forwardRef<HTMLDivElement, RowProps>(
  (
    {
      children,
      gap = "md",
      align = "center",
      justify = "start",
      wrap = false,
      className = "",
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={`flex ${wrap ? "flex-wrap" : ""} ${rowGaps[gap]} ${alignRow[align]} ${justifyContent[justify]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
Row.displayName = "Row";

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

interface DividerProps {
  className?: string;
  label?: string;
}

/**
 * Horizontal rule with optional centered label.
 */
export const Divider: React.FC<DividerProps> = ({ className = "", label }) => {
  if (label) {
    return (
      <div className={`flex items-center gap-3 ${className}`} role="separator">
        <span className="flex-1 border-t border-neutral-200" />
        <span className="text-xs text-neutral-400 font-medium">{label}</span>
        <span className="flex-1 border-t border-neutral-200" />
      </div>
    );
  }
  return (
    <hr
      className={`border-t border-neutral-200 ${className}`}
      role="separator"
    />
  );
};
Divider.displayName = "Divider";
