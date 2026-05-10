"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, Star } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";

const DIVISIONS = ["Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"];

interface Address {
  id: string;
  label: string;
  street: string;
  area?: string;
  district: string;
  division: string;
  postalCode?: string;
  phone: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "", street: "", area: "", district: "", division: "", postalCode: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const fetchAddresses = async () => {
    const res = await fetch("/api/addresses");
    const data = await res.json();
    setAddresses(data);
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ label: "", street: "", area: "", district: "", division: "", postalCode: "", phone: "" });
      await fetchAddresses();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    await fetchAddresses();
  };

  if (loading) return <div className="text-gray-400 text-sm">Loading addresses...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">Addresses</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="min-h-10">
          <Plus className="h-4 w-4 mr-1.5" /> Add
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="border border-gray-200 rounded-lg p-4 sm:p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home, Office..." required />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" required />
          </div>
          <Input label="Street Address" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="House #, Road #, Block..." required />
          <Input label="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Gulshan, Dhanmondi..." />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="District" required />
            <Select label="Division" value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} required options={[{ label: "Select", value: "" }, ...DIVISIONS.map((d) => ({ label: d, value: d }))]} />
            <Input label="Postal Code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="1234" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={saving} className="min-h-11">{saving ? "Saving..." : "Save Address"}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="min-h-11">Cancel</Button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No saved addresses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`border rounded-lg p-4 sm:p-5 relative ${addr.isDefault ? "border-black" : "border-gray-200"}`}>
              {addr.isDefault && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded">Default</span>
              )}
              <p className="font-medium text-sm mb-1">{addr.label}</p>
              <p className="text-sm text-gray-600">{addr.street}</p>
              {addr.area && <p className="text-sm text-gray-500">{addr.area}</p>}
              <p className="text-sm text-gray-500">{addr.district}, {addr.division}</p>
              <p className="text-sm text-gray-500 mt-1">{addr.phone}</p>
              <div className="flex gap-2 mt-3">
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-gray-500 hover:text-black flex items-center gap-1">
                    <Star className="h-3 w-3" /> Set default
                  </button>
                )}
                <button onClick={() => handleDelete(addr.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

