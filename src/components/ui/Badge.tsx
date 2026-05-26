interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: { background: "var(--color-surface)", color: "var(--color-text-secondary)" },
  success: { background: "color-mix(in oklab, var(--color-success), transparent 86%)", color: "var(--color-success)" },
  warning: { background: "color-mix(in oklab, var(--color-warning), transparent 86%)", color: "var(--color-warning)" },
  danger: { background: "color-mix(in oklab, var(--color-danger), transparent 86%)", color: "var(--color-danger)" },
  info: { background: "var(--color-surface)", color: "var(--color-accent)" },
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}
