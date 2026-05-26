import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, id, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wide mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`w-full border px-4 py-3 text-sm outline-none transition-colors bg-[var(--color-elevated)] text-[var(--color-text-primary)] ${
            error ? "border-[var(--color-danger)]" : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs mt-1 text-[var(--color-danger)]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export { Select };
