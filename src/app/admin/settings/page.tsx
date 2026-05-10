"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Truck, CreditCard } from "lucide-react";
import { Button, Input, Modal, Tabs, Textarea } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

interface ShippingZone {
  id: string;
  name: string;
  divisions: string[];
  flatRate: number;
}

interface PaymentAccount {
  id: string;
  method: string;
  accountNumber: string;
  accountName: string | null;
  isActive: boolean;
}

interface HeroSettings {
  label: string;
  titleLine1: string;
  titleAccent: string;
  titleLine2: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  trustItems: string[];
}

interface ProductOption {
  id: string;
  name: string;
  status: string;
}

interface HomepageProductsSettings {
  featuredIds: string[];
  popularIds: string[];
}

const BD_DIVISIONS = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold uppercase tracking-tight">Settings</h1>
      <Tabs
        tabs={[
          { id: "shipping", label: "Shipping Zones", content: <ShippingZonesSection /> },
          { id: "payments", label: "Payment Accounts", content: <PaymentAccountsSection /> },
          { id: "hero", label: "Hero", content: <HeroSettingsSection /> },
          { id: "homepage-products", label: "Homepage Products", content: <HomepageProductsSection /> },
        ]}
      />
    </div>
  );
}

// â”€â”€â”€ Shipping Zones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ShippingZonesSection() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [form, setForm] = useState({ name: "", divisions: [] as string[], flatRate: 0 });

  const fetchZones = useCallback(async () => {
    const res = await fetch("/api/shipping-zones");
    setZones(await res.json());
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? "PATCH" : "POST";
    const url = editing ? `/api/shipping-zones/${editing.id}` : "/api/shipping-zones";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, flatRate: Math.round(form.flatRate * 100) }),
    });

    if (res.ok) {
      setModalOpen(false);
      setEditing(null);
      setForm({ name: "", divisions: [], flatRate: 0 });
      fetchZones();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shipping zone?")) return;
    await fetch(`/api/shipping-zones/${id}`, { method: "DELETE" });
    fetchZones();
  };

  const openEdit = (zone: ShippingZone) => {
    setEditing(zone);
    setForm({ name: zone.name, divisions: zone.divisions, flatRate: zone.flatRate / 100 });
    setModalOpen(true);
  };

  const toggleDivision = (div: string) => {
    setForm((f) => ({
      ...f,
      divisions: f.divisions.includes(div)
        ? f.divisions.filter((d) => d !== div)
        : [...f.divisions, div],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Define shipping rates by region</p>
        <Button onClick={() => { setEditing(null); setForm({ name: "", divisions: [], flatRate: 0 }); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Zone
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wide text-gray-500">
              <th className="text-left px-6 py-4">Zone</th>
              <th className="text-left px-6 py-4">Divisions</th>
              <th className="text-right px-6 py-4">Rate</th>
              <th className="text-right px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{zone.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{zone.divisions.join(", ")}</td>
                <td className="px-6 py-4 text-sm text-right font-medium">{formatPrice(zone.flatRate)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(zone)} className="p-1.5 text-gray-400 hover:text-black"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(zone.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {zones.length === 0 && (
              <tr><td colSpan={4} className="text-center py-12 text-gray-400 text-sm"><Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />No shipping zones</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Zone" : "Add Zone"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Zone Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Divisions</label>
            <div className="flex flex-wrap gap-2">
              {BD_DIVISIONS.map((div) => (
                <button
                  key={div}
                  type="button"
                  onClick={() => toggleDivision(div)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${form.divisions.includes(div) ? "border-black bg-black text-white" : "border-gray-300 hover:border-black"}`}
                >
                  {div}
                </button>
              ))}
            </div>
          </div>
          <Input label="Flat Rate (BDT)" type="number" step="0.01" value={form.flatRate.toString()} onChange={(e) => setForm((f) => ({ ...f, flatRate: parseFloat(e.target.value) || 0 }))} required />
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">{editing ? "Update" : "Create"}</Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// â”€â”€â”€ Payment Accounts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PaymentAccountsSection() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ method: "BKASH", accountNumber: "", accountName: "" });

  const fetchAccounts = useCallback(async () => {
    const res = await fetch("/api/payment-accounts");
    setAccounts(await res.json());
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/payment-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setModalOpen(false);
      setForm({ method: "BKASH", accountNumber: "", accountName: "" });
      fetchAccounts();
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/payment-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this payment account?")) return;
    await fetch(`/api/payment-accounts/${id}`, { method: "DELETE" });
    fetchAccounts();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Merchant numbers shown to customers at checkout</p>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Account
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wide text-gray-500">
              <th className="text-left px-6 py-4">Method</th>
              <th className="text-left px-6 py-4">Number</th>
              <th className="text-left px-6 py-4">Name</th>
              <th className="text-center px-6 py-4">Status</th>
              <th className="text-right px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium uppercase">{acc.method}</td>
                <td className="px-6 py-4 text-sm font-mono">{acc.accountNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{acc.accountName || "â€”"}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => toggleActive(acc.id, acc.isActive)} className={`text-xs px-3 py-1 rounded-full font-medium ${acc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {acc.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end">
                    <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm"><CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />No payment accounts</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Payment Account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Method</label>
            <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black">
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
            </select>
          </div>
          <Input label="Account Number" value={form.accountNumber} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} required />
          <Input label="Account Name" value={form.accountName} onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Add Account</Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function HeroSettingsSection() {
  const [form, setForm] = useState<HeroSettings>({
    label: "",
    titleLine1: "",
    titleAccent: "",
    titleLine2: "",
    subtitle: "",
    primaryCtaText: "",
    primaryCtaHref: "",
    secondaryCtaText: "",
    secondaryCtaHref: "",
    trustItems: ["", "", ""],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchHeroSettings = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/settings/hero");
    const data = await res.json();
    setForm({
      label: data.label || "",
      titleLine1: data.titleLine1 || "",
      titleAccent: data.titleAccent || "",
      titleLine2: data.titleLine2 || "",
      subtitle: data.subtitle || "",
      primaryCtaText: data.primaryCtaText || "",
      primaryCtaHref: data.primaryCtaHref || "",
      secondaryCtaText: data.secondaryCtaText || "",
      secondaryCtaHref: data.secondaryCtaHref || "",
      trustItems: Array.isArray(data.trustItems) ? data.trustItems.slice(0, 3) : ["", "", ""],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHeroSettings();
  }, [fetchHeroSettings]);

  const updateTrustItem = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.trustItems];
      next[index] = value;
      return { ...prev, trustItems: next };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const payload: HeroSettings = {
      ...form,
      trustItems: [...form.trustItems, "", "", ""].slice(0, 3),
    };

    const res = await fetch("/api/admin/settings/hero", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      setMessage("Failed to save hero settings.");
      return;
    }
    setMessage("Hero settings saved.");
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading hero settings...</p>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-3xl">
      <p className="text-sm text-gray-500">Control the storefront hero content for desktop and mobile.</p>
      <Input label="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input label="Title Line 1" value={form.titleLine1} onChange={(e) => setForm((f) => ({ ...f, titleLine1: e.target.value }))} required />
        <Input label="Title Accent" value={form.titleAccent} onChange={(e) => setForm((f) => ({ ...f, titleAccent: e.target.value }))} required />
        <Input label="Title Line 2" value={form.titleLine2} onChange={(e) => setForm((f) => ({ ...f, titleLine2: e.target.value }))} required />
      </div>
      <Textarea label="Subtitle" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} required />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="Primary CTA Text" value={form.primaryCtaText} onChange={(e) => setForm((f) => ({ ...f, primaryCtaText: e.target.value }))} required />
        <Input label="Primary CTA URL" value={form.primaryCtaHref} onChange={(e) => setForm((f) => ({ ...f, primaryCtaHref: e.target.value }))} required />
        <Input label="Secondary CTA Text" value={form.secondaryCtaText} onChange={(e) => setForm((f) => ({ ...f, secondaryCtaText: e.target.value }))} required />
        <Input label="Secondary CTA URL" value={form.secondaryCtaHref} onChange={(e) => setForm((f) => ({ ...f, secondaryCtaHref: e.target.value }))} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input label="Trust Item 1" value={form.trustItems[0] || ""} onChange={(e) => updateTrustItem(0, e.target.value)} required />
        <Input label="Trust Item 2" value={form.trustItems[1] || ""} onChange={(e) => updateTrustItem(1, e.target.value)} required />
        <Input label="Trust Item 3" value={form.trustItems[2] || ""} onChange={(e) => updateTrustItem(2, e.target.value)} required />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Hero Settings"}</Button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    </form>
  );
}

function HomepageProductsSection() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [form, setForm] = useState<HomepageProductsSettings>({ featuredIds: [], popularIds: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const [productsRes, settingsRes] = await Promise.all([
      fetch("/api/products?status=ACTIVE&limit=200"),
      fetch("/api/admin/settings/homepage-products"),
    ]);

    const productsJson = await productsRes.json();
    const settingsJson = await settingsRes.json();

    setProducts(Array.isArray(productsJson.products) ? productsJson.products : []);
    setForm({
      featuredIds: Array.isArray(settingsJson.featuredIds) ? settingsJson.featuredIds : [],
      popularIds: Array.isArray(settingsJson.popularIds) ? settingsJson.popularIds : [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleId = (key: "featuredIds" | "popularIds", id: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((x) => x !== id) : [...prev[key], id],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/settings/homepage-products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (!res.ok) {
      setMessage("Failed to save homepage product settings.");
      return;
    }
    setMessage("Homepage product settings saved.");
  };

  if (loading) return <p className="text-sm text-gray-500">Loading homepage product settings...</p>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <p className="text-sm text-gray-500">
        Select products for Featured and Popular sections. New Arrivals remains automatic.
      </p>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide">Featured Products</h3>
        <div className="max-h-72 overflow-auto border border-gray-200 rounded-lg p-3 space-y-2">
          {products.map((p) => (
            <label key={`featured-${p.id}`} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featuredIds.includes(p.id)}
                onChange={() => toggleId("featuredIds", p.id)}
              />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide">Popular Products</h3>
        <div className="max-h-72 overflow-auto border border-gray-200 rounded-lg p-3 space-y-2">
          {products.map((p) => (
            <label key={`popular-${p.id}`} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.popularIds.includes(p.id)}
                onChange={() => toggleId("popularIds", p.id)}
              />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Homepage Products"}</Button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    </form>
  );
}
