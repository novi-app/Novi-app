import * as React from "react";

interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Novi Base Select
 * Accessible, forwardRef, error support
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error,
    options,
    placeholder = "Select an option",
    className = "",
    id,
    ...props
  }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={selectId}
            className="ml-1 text-sm font-semibold text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              h-14 w-full appearance-none rounded-2xl border bg-gray-50/50 px-4 pr-10
              text-gray-900 transition-all focus:outline-none focus:ring-4
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                  : "border-gray-200 focus:border-[#FF8904] focus:ring-[#FF8904]/15"
              }
              ${className}
            `}
            aria-invalid={error ? true : false}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            ▾
          </span>
        </div>
        {error && (
          <p
            id={`${selectId}-error`}
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

Select.displayName = "Select";
