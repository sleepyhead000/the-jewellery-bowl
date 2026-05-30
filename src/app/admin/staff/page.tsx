"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Badge, Button, Input, Select } from "@/components/ui";

type StaffRole = "STAFF" | "MANAGER" | "ADMIN";

type StaffMember = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: StaffRole;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
};

type StaffResponse = {
  staff?: StaffMember[];
  error?: unknown;
};

type StaffForm = {
  email: string;
  name: string;
  role: StaffRole;
};

const roleOptions: Array<{ label: string; value: StaffRole }> = [
  { label: "Staff", value: "STAFF" },
  { label: "Manager", value: "MANAGER" },
  { label: "Admin", value: "ADMIN" },
];

const roleVariant = (role: StaffRole): "default" | "success" | "warning" => {
  if (role === "ADMIN") return "warning";
  if (role === "MANAGER") return "success";
  return "default";
};

const formatError = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "fieldErrors" in error) return "Check the staff details and try again.";
  return "The staff update failed.";
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState<string>("");
  const [form, setForm] = useState<StaffForm>({ email: "", name: "", role: "STAFF" });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const visibleStaff = useMemo(() => staff, [staff]);

  const fetchStaff = async (query: string) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (query.trim().length > 0) params.set("search", query.trim());

    const res = await fetch(`/api/admin/staff?${params.toString()}`);
    const data = (await res.json()) as StaffResponse;
    if (!res.ok) {
      setError(formatError(data.error));
      setLoading(false);
      return;
    }

    setStaff(data.staff ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchStaff("");
  }, []);

  const addStaff = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as StaffResponse;

    if (!res.ok) {
      setError(formatError(data.error));
      setSaving(false);
      return;
    }

    setForm({ email: "", name: "", role: "STAFF" });
    await fetchStaff(search);
    setSaving(false);
  };

  const updateRole = async (member: StaffMember, role: StaffRole) => {
    setError("");
    const res = await fetch("/api/admin/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, name: member.name ?? undefined, role }),
    });
    const data = (await res.json()) as StaffResponse;

    if (!res.ok) {
      setError(formatError(data.error));
      return;
    }

    await fetchStaff(search);
  };

  const removeStaff = async (member: StaffMember) => {
    if (!confirm(`Remove staff access for ${member.email ?? member.name ?? "this user"}?`)) return;

    setError("");
    const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(member.id)}`, { method: "DELETE" });
    const data = (await res.json()) as StaffResponse;

    if (!res.ok) {
      setError(formatError(data.error));
      return;
    }

    await fetchStaff(search);
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchStaff(search);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Staff</h1>
          <p className="text-sm text-gray-500 mt-1">Add staff by email and manage access separately from customers.</p>
        </div>
        <Badge variant="default">{staff.length} staff</Badge>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <form onSubmit={submitSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search staff by name, email, or phone..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 text-sm outline-none focus:border-black"
              />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3">Staff Member</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : visibleStaff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No staff members found
                    </td>
                  </tr>
                ) : (
                  visibleStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="font-medium">{member.name || "Unnamed staff"}</div>
                        <div className="text-xs text-gray-500">{member.email || "No email"}</div>
                        {member.phone && <div className="text-xs text-gray-400">{member.phone}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <Select
                          value={member.role}
                          onChange={(event) => void updateRole(member, event.target.value as StaffRole)}
                          options={roleOptions}
                          className="min-w-32 py-2"
                          aria-label="Role"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <Badge variant={roleVariant(member.role)}>{member.role}</Badge>
                          <span className="text-xs text-gray-400">
                            {member.emailVerified ? "Email verified" : "Pending Google sign-in"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button type="button" variant="ghost" size="sm" onClick={() => void removeStaff(member)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={addStaff} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gray-500" />
            <h2 className="text-sm font-bold uppercase tracking-wide">Add Staff</h2>
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as StaffRole }))}
            options={roleOptions}
          />
          <Button type="submit" loading={saving} className="w-full">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
          <p className="text-xs text-gray-500">
            New staff can sign in with Google using this email. Existing customers are promoted without losing their orders.
          </p>
        </form>
      </div>
    </div>
  );
}
