export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) return "Password must be at least 10 characters long";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must include a number";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a special character";

  const weakPatterns = ["password", "123456", "qwerty", "admin", "tnluxury"];
  const lower = password.toLowerCase();
  if (weakPatterns.some((p) => lower.includes(p))) {
    return "Password contains a commonly used pattern";
  }

  return null;
}

