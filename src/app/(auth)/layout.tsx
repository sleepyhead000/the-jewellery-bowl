export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {children}
    </div>
  );
}
