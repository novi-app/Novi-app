import * as React from "react";

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  size?: "sm" | "md" | "lg";
  helperText?: string;
  error?: string;
  className?: string;
}

interface SelectOptionProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
}

interface SelectGroupProps extends React.OptgroupHTMLAttributes<HTMLOptGroupElement> {
  children: React.ReactNode;
}

// Subcomponent types attached to Select
interface SelectComponent
  extends React.ForwardRefExoticComponent<
    SelectProps & React.RefAttributes<HTMLSelectElement>
  > {
  Option: React.FC<SelectOptionProps>;
  Group: React.FC<SelectGroupProps>;
}

const sizeStyles = {
  sm: "h-10 px-3 text-sm",
  md: "h-12 px-4 text-base",
  lg: "h-14 px-5 text-lg",
};

const ChevronIcon = () => (
  <svg
    className="h-4 w-4 text-neutral-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

/**
 * Reusable Select with label, error, size, Option, and Group subcomponents.
 *
 * Usage:
 *   <Select label="Country" size="md">
 *     <Select.Option value="">Choose one…</Select.Option>
 *     <Select.Group label="Europe">
 *       <Select.Option value="fr">France</Select.Option>
 *     </Select.Group>
 *   </Select>
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, size = "md", helperText, error, children, id, className = "", ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const helperId = `${selectId}-helper`;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col w-full gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={hasError}
            aria-describedby={helperText || error ? helperId : undefined}
            className={`
              w-full appearance-none rounded-pill border bg-white text-neutral-900
              focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
              pr-10
              ${hasError
                ? "border-error focus:ring-error/40"
                : "border-neutral-300 focus:ring-primary/50 focus:border-primary"
              }
              ${sizeStyles[size]}
              ${className}
            `}
            {...props}
          >
            {children}
          </select>

          {/* Custom chevron */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronIcon />
          </span>
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
) as SelectComponent;

Select.Option = ({ children, ...props }) => <option {...props}>{children}</option>;
Select.Group = ({ children, ...props }) => <optgroup {...props}>{children}</optgroup>;

Select.displayName = "Select";
Select.Option.displayName = "Select.Option";
Select.Group.displayName = "Select.Group";
