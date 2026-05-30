"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Truck, CreditCard } from "lucide-react";
import { Button, Input, Modal, Tabs, Textarea } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import type {
  HomepageHeroSlidesConfig,
  HomepageLayoutConfig,
  HomepageTranslationsConfig,
  HomepageTopbarModeConfig,
  HomepageDiscountMerchConfig,
} from "@/lib/homepage-config";
import type { FooterSettingsConfig, FooterLinkConfig, FooterSocialConfig } from "@/lib/footer-config";
import type { ContentPageConfig, ContentPageKey, ContentPagesConfig } from "@/lib/content-pages-config";

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

interface ProductOption {
  id: string;
  name: string;
  status: string;
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
          { id: "footer", label: "Footer + Social", content: <FooterSettingsSection /> },
          { id: "content-pages", label: "Content Pages", content: <ContentPagesSettingsSection /> },
          { id: "homepage-design", label: "Homepage Design", content: <HomepageDesignSettingsSection /> },
        ]}
      />
    </div>
  );
}

function FooterSettingsSection() {
  const [form, setForm] = useState<FooterSettingsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchFooterSettings = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/settings/footer");
    const data = await res.json();
    setForm(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFooterSettings();
  }, [fetchFooterSettings]);

  const updateField = (key: keyof FooterSettingsConfig, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateLink = (
    group: "headerLinks" | "shopLinks" | "supportLinks" | "legalLinks",
    index: number,
    next: FooterLinkConfig
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, [group]: prev[group].map((entry, i) => (i === index ? next : entry)) };
    });
  };

  const updateSocial = (index: number, next: FooterSocialConfig) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, socialLinks: prev.socialLinks.map((entry, i) => (i === index ? next : entry)) };
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/settings/footer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (!res.ok) {
      setMessage("Failed to save footer settings.");
      return;
    }
    setMessage("Footer settings saved.");
  };

  if (loading) return <p className="text-sm text-gray-500">Loading footer settings...</p>;
  if (!form) return <p className="text-sm text-gray-500">Footer settings are unavailable.</p>;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <p className="text-sm text-gray-500">Control storefront header links, footer copy, footer links, and social media URLs.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="Brand Name" value={form.brandName} onChange={(e) => updateField("brandName", e.target.value)} />
        <Input label="Newsletter Title" value={form.newsletterTitle} onChange={(e) => updateField("newsletterTitle", e.target.value)} />
        <Input label="Newsletter Button" value={form.newsletterButtonLabel} onChange={(e) => updateField("newsletterButtonLabel", e.target.value)} />
        <Input label="Newsletter Description" value={form.newsletterDescription} onChange={(e) => updateField("newsletterDescription", e.target.value)} />
      </div>

      <Textarea
        label="Brand Description"
        value={form.brandDescription}
        onChange={(e) => updateField("brandDescription", e.target.value)}
        rows={4}
      />

      <FooterLinksEditor title="Header Links" links={form.headerLinks} onChange={(index, next) => updateLink("headerLinks", index, next)} />
      <FooterLinksEditor title="Shop Links" links={form.shopLinks} onChange={(index, next) => updateLink("shopLinks", index, next)} />
      <FooterLinksEditor title="Support Links" links={form.supportLinks} onChange={(index, next) => updateLink("supportLinks", index, next)} />
      <FooterLinksEditor title="Legal Links" links={form.legalLinks} onChange={(index, next) => updateLink("legalLinks", index, next)} />

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {form.socialLinks.map((social, index) => (
            <div key={social.platform} className="space-y-2 border border-gray-100 rounded p-3">
              <label className="flex items-center gap-2 text-sm font-medium capitalize">
                <input
                  type="checkbox"
                  checked={social.enabled}
                  onChange={(e) => updateSocial(index, { ...social, enabled: e.target.checked })}
                />
                {social.platform}
              </label>
              <Input
                label="URL"
                value={social.href}
                onChange={(e) => updateSocial(index, { ...social, href: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Footer Settings"}</Button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    </form>
  );
}

function FooterLinksEditor({
  title,
  links,
  onChange,
}: {
  title: string;
  links: FooterLinkConfig[];
  onChange: (index: number, next: FooterLinkConfig) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {links.map((link, index) => (
          <div key={`${title}-${index}`} className="grid grid-cols-1 gap-2 border border-gray-100 rounded p-3">
            <Input label={`Label ${index + 1}`} value={link.label} onChange={(e) => onChange(index, { ...link, label: e.target.value })} />
            <Input label={`URL ${index + 1}`} value={link.href} onChange={(e) => onChange(index, { ...link, href: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}

const CONTENT_PAGE_FIELDS: { key: ContentPageKey; label: string; supportsList: boolean }[] = [
  { key: "about", label: "About Page", supportsList: false },
  { key: "contact", label: "Contact Page", supportsList: false },
  { key: "howToBuy", label: "How To Buy Page", supportsList: true },
  { key: "faqs", label: "FAQs Page", supportsList: true },
  { key: "returns", label: "Returns Page", supportsList: false },
  { key: "privacyPolicy", label: "Privacy Policy Page", supportsList: false },
  { key: "termsOfService", label: "Terms of Service Page", supportsList: false },
];

function ContentPagesSettingsSection() {
  const [form, setForm] = useState<ContentPagesConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchContentPages = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/settings/content-pages");
    const data = await res.json();
    setForm(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContentPages();
  }, [fetchContentPages]);

  const updatePage = (key: ContentPageKey, next: ContentPageConfig) => {
    setForm((prev) => (prev ? { ...prev, [key]: next } : prev));
  };

  const updateListItems = (key: ContentPageKey, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const listItems = value
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean);
      return { ...prev, [key]: { ...prev[key], listItems } };
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/settings/content-pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (!res.ok) {
      setMessage("Failed to save content pages.");
      return;
    }
    setMessage("Content pages saved.");
  };

  if (loading) return <p className="text-sm text-gray-500">Loading content pages...</p>;
  if (!form) return <p className="text-sm text-gray-500">Content pages are unavailable.</p>;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <p className="text-sm text-gray-500">Edit the text shown inside storefront content and policy pages.</p>

      {CONTENT_PAGE_FIELDS.map((field) => {
        const page = form[field.key];
        return (
          <div key={field.key} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide">{field.label}</h3>
            <Input
              label="Page Title"
              value={page.title}
              onChange={(e) => updatePage(field.key, { ...page, title: e.target.value })}
            />
            <Textarea
              label="Page Body"
              value={page.body}
              onChange={(e) => updatePage(field.key, { ...page, body: e.target.value })}
              rows={5}
            />
            {field.supportsList && (
              <Textarea
                label="Steps / List Items"
                value={page.listItems.join("\n")}
                onChange={(e) => updateListItems(field.key, e.target.value)}
                rows={6}
              />
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Content Pages"}</Button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    </form>
  );
}

// Shipping Zones

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

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="min-w-[640px] w-full">
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

// Payment Accounts

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

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="min-w-[640px] w-full">
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
                <td className="px-6 py-4 text-sm text-gray-500">{acc.accountName || "-"}</td>
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

function HomepageDesignSettingsSection() {
  const [layout, setLayout] = useState<HomepageLayoutConfig | null>(null);
  const [slides, setSlides] = useState<HomepageHeroSlidesConfig | null>(null);
  const [translations, setTranslations] = useState<HomepageTranslationsConfig | null>(null);
  const [topbarMode, setTopbarMode] = useState<HomepageTopbarModeConfig | null>(null);
  const [discountMerch, setDiscountMerch] = useState<HomepageDiscountMerchConfig | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHeroSlideIndex, setUploadingHeroSlideIndex] = useState<number | null>(null);
  const [uploadingSectionImageId, setUploadingSectionImageId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const [layoutRes, slidesRes, translationsRes, topbarRes, discountRes, productsRes] = await Promise.all([
      fetch("/api/admin/settings/homepage-layout"),
      fetch("/api/admin/settings/homepage-hero-slides"),
      fetch("/api/admin/settings/homepage-translations"),
      fetch("/api/admin/settings/homepage-topbar-mode"),
      fetch("/api/admin/settings/homepage-discount-merch"),
      fetch("/api/products?status=ACTIVE&limit=200"),
    ]);

    const [layoutData, slidesData, translationsData, topbarData, discountData, productsData] = await Promise.all([
      layoutRes.json(),
      slidesRes.json(),
      translationsRes.json(),
      topbarRes.json(),
      discountRes.json(),
      productsRes.json(),
    ]);

    setLayout(layoutData);
    setSlides(slidesData);
    setTranslations(translationsData);
    setTopbarMode(topbarData);
    setDiscountMerch(discountData);
    setProducts(Array.isArray(productsData.products) ? productsData.products : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (!layout || !slides || !translations || !topbarMode || !discountMerch) {
      setSaving(false);
      setMessage("Settings are not loaded yet.");
      return;
    }
    if (slides.slides.length === 0) {
      setSaving(false);
      setMessage("At least one hero slide is required.");
      return;
    }

    const responses = await Promise.all([
      fetch("/api/admin/settings/homepage-layout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      }),
      fetch("/api/admin/settings/homepage-hero-slides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slides),
      }),
      fetch("/api/admin/settings/homepage-translations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(translations),
      }),
      fetch("/api/admin/settings/homepage-topbar-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topbarMode),
      }),
      fetch("/api/admin/settings/homepage-discount-merch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discountMerch),
      }),
    ]);

    if (responses.some((response) => !response.ok)) {
      setSaving(false);
      setMessage("Failed to save one or more homepage design payloads.");
      return;
    }

    setSaving(false);
    setMessage("Homepage design settings saved.");
    fetchData();
  };

  if (loading) return <p className="text-sm text-gray-500">Loading homepage design settings...</p>;
  if (!layout || !slides || !translations || !topbarMode || !discountMerch) {
    return <p className="text-sm text-gray-500">Homepage settings are unavailable.</p>;
  }

  const togglePinnedDiscount = (id: string) => {
    setDiscountMerch((prev) =>
      prev
        ? {
            ...prev,
            pinnedProductIds: prev.pinnedProductIds.includes(id)
              ? prev.pinnedProductIds.filter((x) => x !== id)
              : [...prev.pinnedProductIds, id],
          }
        : prev
    );
  };

  const moveSection = (sectionId: string, direction: "up" | "down") => {
    setLayout((prev) => {
      if (!prev) return prev;
      const order = [...prev.sectionOrder];
      const currentIndex = order.indexOf(sectionId);
      if (currentIndex < 0) return prev;
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= order.length) return prev;
      const temp = order[currentIndex];
      order[currentIndex] = order[targetIndex];
      order[targetIndex] = temp;
      return { ...prev, sectionOrder: order };
    });
  };

  const uploadSectionImage = async (sectionId: string, file: File) => {
    setUploadingSectionImageId(sectionId);
    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setMessage("Section image upload failed.");
        return;
      }

      const uploaded = Array.isArray(data.uploaded) ? data.uploaded : [];
      const first = uploaded[0] as { urls?: { large?: string; medium?: string } } | undefined;
      const nextUrl = first?.urls?.large ?? first?.urls?.medium;

      if (!nextUrl) {
        setMessage("Section image upload completed but no usable URL was returned.");
        return;
      }

      setLayout((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((entry) =>
                entry.id === sectionId ? { ...entry, imageUrl: nextUrl } : entry
              ),
            }
          : prev
      );
      setMessage("Section image uploaded.");
    } catch {
      setMessage("Section image upload failed.");
    } finally {
      setUploadingSectionImageId(null);
    }
  };

  const uploadHeroImage = async (slideIndex: number, file: File) => {
    setUploadingHeroSlideIndex(slideIndex);
    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setMessage("Hero image upload failed.");
        return;
      }

      const uploaded = Array.isArray(data.uploaded) ? data.uploaded : [];
      const first = uploaded[0] as { urls?: { large?: string; medium?: string } } | undefined;
      const nextUrl = first?.urls?.large ?? first?.urls?.medium;

      if (!nextUrl) {
        setMessage("Hero image upload completed but no usable URL was returned.");
        return;
      }

      setSlides((prev) =>
        prev
          ? {
              ...prev,
              slides: prev.slides.map((entry, i) => (i === slideIndex ? { ...entry, imageUrl: nextUrl } : entry)),
            }
          : prev
      );
      setMessage("Hero image uploaded.");
    } catch {
      setMessage("Hero image upload failed.");
    } finally {
      setUploadingHeroSlideIndex(null);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <p className="text-sm text-gray-500">
        Manage homepage sections, top bar content, hero slides, translations, and discount merchandising from structured controls.
      </p>

      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide">Top Bar Source</h3>
        <div className="flex gap-4">
          <label className="text-sm flex items-center gap-2">
            <input
              type="radio"
              checked={topbarMode.mode === "static"}
              onChange={() => setTopbarMode((prev) => (prev ? { ...prev, mode: "static" } : prev))}
            />
            Static message
          </label>
          <label className="text-sm flex items-center gap-2">
            <input
              type="radio"
              checked={topbarMode.mode === "announcements"}
              onChange={() => setTopbarMode((prev) => (prev ? { ...prev, mode: "announcements" } : prev))}
            />
            Announcements
          </label>
        </div>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={topbarMode.enabled}
            onChange={(e) => setTopbarMode((prev) => (prev ? { ...prev, enabled: e.target.checked } : prev))}
          />
          Top bar enabled
        </label>
        {topbarMode.mode === "static" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Static Text (EN)"
              value={topbarMode.staticText.en}
              onChange={(e) =>
                setTopbarMode((prev) =>
                  prev ? { ...prev, staticText: { ...prev.staticText, en: e.target.value } } : prev
                )
              }
            />
            <Input
              label="Static Text (BN)"
              value={topbarMode.staticText.bn}
              onChange={(e) =>
                setTopbarMode((prev) =>
                  prev ? { ...prev, staticText: { ...prev.staticText, bn: e.target.value } } : prev
                )
              }
            />
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide">Hero Slides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Autoplay (ms)"
            type="number"
            value={String(slides.autoplayMs)}
            onChange={(e) =>
              setSlides((prev) => (prev ? { ...prev, autoplayMs: parseInt(e.target.value) || 4500 } : prev))
            }
          />
        </div>
        {slides.slides.map((slide, index) => (
          <div key={slide.id} className="border border-gray-100 rounded p-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide">Slide {index + 1}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Kicker (EN)"
                value={slide.kicker.en}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) =>
                            i === index ? { ...entry, kicker: { ...entry.kicker, en: e.target.value } } : entry
                          ),
                        }
                      : prev
                  )
                }
              />
              <Input
                label="Kicker (BN)"
                value={slide.kicker.bn}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) =>
                            i === index ? { ...entry, kicker: { ...entry.kicker, bn: e.target.value } } : entry
                          ),
                        }
                      : prev
                  )
                }
              />
              <Input
                label="Heading Prefix (EN)"
                value={slide.headingPrefix.en}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) =>
                            i === index ? { ...entry, headingPrefix: { ...entry.headingPrefix, en: e.target.value } } : entry
                          ),
                        }
                      : prev
                  )
                }
              />
              <Input
                label="Heading Prefix (BN)"
                value={slide.headingPrefix.bn}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) =>
                            i === index ? { ...entry, headingPrefix: { ...entry.headingPrefix, bn: e.target.value } } : entry
                          ),
                        }
                      : prev
                  )
                }
              />
              <Input
                label="Heading Accent (EN)"
                value={slide.headingAccent.en}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) =>
                            i === index ? { ...entry, headingAccent: { ...entry.headingAccent, en: e.target.value } } : entry
                          ),
                        }
                      : prev
                  )
                }
              />
              <Input
                label="Heading Accent (BN)"
                value={slide.headingAccent.bn}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) =>
                            i === index ? { ...entry, headingAccent: { ...entry.headingAccent, bn: e.target.value } } : entry
                          ),
                        }
                      : prev
                  )
                }
              />
              <Input
                label="CTA Label (EN)"
                value={slide.ctaLabel.en}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) =>
                            i === index ? { ...entry, ctaLabel: { ...entry.ctaLabel, en: e.target.value } } : entry
                          ),
                        }
                      : prev
                  )
                }
              />
              <Input
                label="CTA Label (BN)"
                value={slide.ctaLabel.bn}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) =>
                            i === index ? { ...entry, ctaLabel: { ...entry.ctaLabel, bn: e.target.value } } : entry
                          ),
                        }
                      : prev
                  )
                }
              />
              <Input
                label="CTA URL"
                value={slide.ctaHref}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) => (i === index ? { ...entry, ctaHref: e.target.value } : entry)),
                        }
                      : prev
                  )
                }
              />
              <Input
                label="Image URL"
                value={slide.imageUrl}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) => (i === index ? { ...entry, imageUrl: e.target.value } : entry)),
                        }
                      : prev
                  )
                }
              />
              {slide.imageUrl.trim().length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide">Image Preview</p>
                  <div className="w-full max-w-[260px] aspect-[4/5] border border-gray-200 bg-gray-50 overflow-hidden rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slide.imageUrl} alt={`Hero slide ${index + 1} preview`} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wide">Upload Hero Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadHeroImage(index, file);
                    }
                    e.target.value = "";
                  }}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                />
                {uploadingHeroSlideIndex === index && (
                  <p className="text-xs text-gray-500">Uploading hero image...</p>
                )}
              </div>
              <Textarea
                label="Description (EN)"
                value={slide.description.en}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) =>
                            i === index ? { ...entry, description: { ...entry.description, en: e.target.value } } : entry
                          ),
                        }
                      : prev
                  )
                }
                rows={3}
              />
              <Textarea
                label="Description (BN)"
                value={slide.description.bn}
                onChange={(e) =>
                  setSlides((prev) =>
                    prev
                      ? {
                          ...prev,
                          slides: prev.slides.map((entry, i) =>
                            i === index ? { ...entry, description: { ...entry.description, bn: e.target.value } } : entry
                          ),
                        }
                      : prev
                  )
                }
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide">Homepage Sections</h3>
        {layout.sectionOrder.map((sectionId) => {
          const section = layout.sections.find((entry) => entry.id === sectionId);
          if (!section) return null;
          return (
            <div key={section.id} className="border border-gray-100 rounded p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide">{section.id}</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => moveSection(section.id, "up")} className="text-xs border px-2 py-1">Up</button>
                  <button type="button" onClick={() => moveSection(section.id, "down")} className="text-xs border px-2 py-1">Down</button>
                  <label className="text-xs flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(e) =>
                        setLayout((prev) =>
                          prev
                            ? {
                                ...prev,
                                sections: prev.sections.map((entry) =>
                                  entry.id === section.id ? { ...entry, enabled: e.target.checked } : entry
                                ),
                              }
                            : prev
                        )
                      }
                    />
                    Enabled
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Title (EN)"
                  value={section.title.en}
                  onChange={(e) =>
                    setLayout((prev) =>
                      prev
                        ? {
                            ...prev,
                            sections: prev.sections.map((entry) =>
                              entry.id === section.id ? { ...entry, title: { ...entry.title, en: e.target.value } } : entry
                            ),
                          }
                        : prev
                    )
                  }
                />
                <Input
                  label="Title (BN)"
                  value={section.title.bn}
                  onChange={(e) =>
                    setLayout((prev) =>
                      prev
                        ? {
                            ...prev,
                            sections: prev.sections.map((entry) =>
                              entry.id === section.id ? { ...entry, title: { ...entry.title, bn: e.target.value } } : entry
                            ),
                          }
                        : prev
                    )
                  }
                />
                <Input
                  label="Limit"
                  type="number"
                  value={String(section.limit)}
                  onChange={(e) =>
                    setLayout((prev) =>
                      prev
                        ? {
                            ...prev,
                            sections: prev.sections.map((entry) =>
                              entry.id === section.id ? { ...entry, limit: parseInt(e.target.value) || 1 } : entry
                            ),
                          }
                        : prev
                    )
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wide">Upload Section Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadSectionImage(section.id, file);
                      }
                      e.target.value = "";
                    }}
                    className="w-full border border-gray-300 px-3 py-2 text-sm"
                  />
                  {uploadingSectionImageId === section.id && (
                    <p className="text-xs text-gray-500">Uploading section image...</p>
                  )}
                </div>
                {section.imageUrl.trim().length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide">Image Preview</p>
                    <div className="w-full max-w-[220px] aspect-square border border-gray-200 bg-gray-50 overflow-hidden rounded">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={section.imageUrl} alt={`${section.id} preview`} className="w-full h-full object-cover" />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide">Discount Section Pinning</h3>
        <p className="text-xs text-gray-500">Pinned products appear first in auto discount sections (salePrice source of truth).</p>
        <div className="max-h-72 overflow-auto border border-gray-200 rounded-lg p-3 space-y-2">
          {products.map((p) => (
            <label key={`discount-pin-${p.id}`} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={discountMerch.pinnedProductIds.includes(p.id)}
                onChange={() => togglePinnedDiscount(p.id)}
              />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide">Global Translations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Nav Home (EN)"
            value={translations.navHome.en}
            onChange={(e) => setTranslations((prev) => (prev ? { ...prev, navHome: { ...prev.navHome, en: e.target.value } } : prev))}
          />
          <Input
            label="Nav Home (BN)"
            value={translations.navHome.bn}
            onChange={(e) => setTranslations((prev) => (prev ? { ...prev, navHome: { ...prev.navHome, bn: e.target.value } } : prev))}
          />
          <Input
            label="Offers Title (EN)"
            value={translations.offersTitle.en}
            onChange={(e) =>
              setTranslations((prev) => (prev ? { ...prev, offersTitle: { ...prev.offersTitle, en: e.target.value } } : prev))
            }
          />
          <Input
            label="Offers Title (BN)"
            value={translations.offersTitle.bn}
            onChange={(e) =>
              setTranslations((prev) => (prev ? { ...prev, offersTitle: { ...prev.offersTitle, bn: e.target.value } } : prev))
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Homepage Design"}</Button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    </form>
  );
}
