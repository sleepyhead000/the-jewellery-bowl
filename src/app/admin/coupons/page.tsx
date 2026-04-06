"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button, Input, Select, Badge, Modal } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  _count?: { orders: number };
}

const EMPTY_FORM = {
  code: "", type: "PERCENTAGE", value: "", minOrderAmount: "", maxDiscount: "",
  usageLimit: "", validFrom: "", validTo: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    const res = await fetch("/api/coupons");
    const data = await res.json();
    setCoupons(data);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.type === "PERCENTAGE" ? c.value : c.value / 100),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount / 100) : "",
      maxDiscount: c.maxDiscount ? String(c.maxDiscount / 100) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : "",
      validTo: c.validTo ? c.validTo.slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      code: form.code,
      type: form.type,
      value: form.type === "PERCENTAGE" ? Number(form.value) : Math.round(Number(form.value) * 100),
      minOrderAmount: form.minOrderAmount ? Math.round(Number(form.minOrderAmount) * 100) : null,
      maxDiscount: form.maxDiscount ? Math.round(Number(form.maxDiscount) * 100) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
    };

    if (editing) {
      await fetch(`/api/coupons/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setShowModal(false);
    setSaving(false);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleActive = async (c: Coupon) => {
    await fetch(`/api/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    fetchCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase tracking-tight">Coupons</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Create Coupon</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Discount</th>
              <th className="px-5 py-3">Min Order</th>
              <th className="px-5 py-3 text-center">Usage</th>
              <th className="px-5 py-3">Valid</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                <Tag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No coupons yet
              </td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-5 py-3">
                    {c.type === "PERCENTAGE" ? `${c.value}%` : formatPrice(c.value)}
                    {c.maxDiscount ? ` (max ${formatPrice(c.maxDiscount)})` : ""}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {c.minOrderAmount ? formatPrice(c.minOrderAmount) : "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {c.validFrom ? new Date(c.validFrom).toLocaleDateString() : "—"}
                    {" → "}
                    {c.validTo ? new Date(c.validTo).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(c)}>
                      <Badge variant={c.isActive ? "success" : "danger"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-black"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal open={showModal} title={editing ? "Edit Coupon" : "Create Coupon"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" required />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[{ label: "Percentage", value: "PERCENTAGE" }, { label: "Fixed Amount", value: "FIXED" }]} />
              <Input
                label={form.type === "PERCENTAGE" ? "Value (%)" : "Value (BDT)"}
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Min Order (BDT)" type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
              <Input label="Max Discount (BDT)" type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
            </div>
            <Input label="Usage Limit" type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Valid From" type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              <Input label="Valid To" type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
