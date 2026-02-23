import * as React from "react";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, size = "md", className = "", id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;

    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <input
          type="checkbox"
          ref={ref}
          id={checkboxId}
          className={`
            ${sizeStyles[size]} mt-0.5 shrink-0 rounded-sm border border-neutral-300
            text-primary accent-primary focus-visible:ring-2 focus-visible:ring-primary/50
            disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
          `}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
                className="select-none text-neutral-900 font-medium cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-sm text-neutral-500 mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
