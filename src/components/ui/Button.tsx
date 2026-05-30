import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex min-h-11 items-center justify-center text-center font-bold uppercase tracking-wide transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "text-[var(--color-accent-contrast)] bg-[var(--color-accent)] hover:opacity-90",
      secondary: "text-[var(--color-text-primary)] bg-[var(--color-surface)] hover:opacity-90",
      outline: "border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]",
      danger: "text-white bg-[var(--color-danger)] hover:opacity-90",
      ghost: "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]",
    };

    const sizes = {
      sm: "text-xs px-3 py-2",
      md: "text-sm px-4 py-2.5",
      lg: "text-sm px-6 py-3",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
