import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wide mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full border px-4 py-3 text-sm outline-none transition-colors placeholder:text-[var(--color-text-muted)] bg-[var(--color-elevated)] text-[var(--color-text-primary)] ${
            error ? "border-[var(--color-danger)] focus:border-[var(--color-danger)]" : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs mt-1 text-[var(--color-danger)]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
