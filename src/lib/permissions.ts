export type Role = "CUSTOMER" | "STAFF" | "MANAGER" | "ADMIN";

export const PERMISSIONS = {
  // Product management
  "products.view": ["STAFF", "MANAGER", "ADMIN"],
  "products.create": ["MANAGER", "ADMIN"],
  "products.edit": ["MANAGER", "ADMIN"],
  "products.delete": ["ADMIN"],

  // Order management
  "orders.view": ["STAFF", "MANAGER", "ADMIN"],
  "orders.update": ["STAFF", "MANAGER", "ADMIN"],
  "orders.delete": ["ADMIN"],

  // Payment verification
  "payments.verify": ["STAFF", "MANAGER", "ADMIN"],

  // Customer management
  "customers.view": ["STAFF", "MANAGER", "ADMIN"],

  // Category management
  "categories.manage": ["MANAGER", "ADMIN"],

  // Coupon management
  "coupons.manage": ["MANAGER", "ADMIN"],

  // Review moderation
  "reviews.moderate": ["STAFF", "MANAGER", "ADMIN"],

  // Staff management
  "staff.manage": ["ADMIN"],

  // Reports
  "reports.view": ["MANAGER", "ADMIN"],

  // Settings
  "settings.manage": ["ADMIN"],

  // Notifications
  "notifications.send": ["MANAGER", "ADMIN"],

  // Audit log
  "audit.view": ["ADMIN"],
} as const satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission];
  return (allowed as readonly string[]).includes(role);
}

export function requireRole(...roles: Role[]) {
  return (userRole: Role): boolean => roles.includes(userRole);
}

export function getRolePermissions(role: Role): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter((permission) =>
    hasPermission(role, permission)
  );
}
