"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApiFetch } from "@/lib/admin-api-client";

type CapabilitiesResponse = {
  role?: string;
  permissions: string[];
};

export function useAdminCapabilities() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApiFetch<CapabilitiesResponse>("/api/admin/capabilities")
      .then((res) => setPermissions(res.permissions))
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, []);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const can = (permission: string): boolean => permissionSet.has(permission);

  return { permissions, loading, can };
}
