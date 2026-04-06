"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface Variant {
  id?: string;
  sku: string;
  price: number;
  salePrice: number;
  stock: number;
  attributes: Record<string, string>;
}

interface ProductFormData {
  name: string;
  description: string;
  basePrice: number;
  categoryId: string;
  status: string;
  isFeatured: boolean;
  tags: string;
  images: string[];
  variants: Variant[];
}

interface ProductFormProps {
  initialData?: ProductFormData & { id: string };
}

const emptyVariant: Variant = { sku: "", price: 0, salePrice: 0, stock: 0, attributes: {} };

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<ProductFormData>(
    initialData ?? {
      name: "",
      description: "",
      basePrice: 0,
      categoryId: "",
      status: "DRAFT",
      isFeatured: false,
      tags: "",
      images: [],
      variants: [{ ...emptyVariant }],
    }
  );

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  const setField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateVariant = (index: number, updates: Partial<Variant>) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...updates } : v)),
    }));

  const addVariant = () =>
    setForm((f) => ({ ...f, variants: [...f.variants, { ...emptyVariant, sku: `SKU-${f.variants.length + 1}` }] }));

  const removeVariant = (index: number) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(e.target.files).forEach((file) => formData.append("files", file));
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      const urls = data.files.map((f: { url: string }) => f.url);
      setField("images", [...form.images, ...urls]);
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (index: number) =>
    setField("images", form.images.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description,
      basePrice: Math.round(form.basePrice * 100),
      categoryId: form.categoryId || null,
      status: form.status,
      isFeatured: form.isFeatured,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      images: form.images.map((url, i) => ({ url, sortOrder: i })),
      variants: form.variants.map((v) => ({
        sku: v.sku,
        price: Math.round(v.price * 100),
        salePrice: v.salePrice ? Math.round(v.salePrice * 100) : null,
        stock: v.stock,
        attributes: v.attributes,
      })),
    };

    const isEdit = !!initialData?.id;
    const url = isEdit ? `/api/products/${initialData.id}` : "/api/products";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/products");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to save product");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Basic Info */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide">Basic Information</h2>
        <Input
          label="Product Name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          required
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={5}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Base Price (BDT)"
            type="number"
            step="0.01"
            value={form.basePrice.toString()}
            onChange={(e) => setField("basePrice", parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <Input
          label="Tags (comma-separated)"
          value={form.tags}
          onChange={(e) => setField("tags", e.target.value)}
          placeholder="luxury, leather, watch"
        />
      </section>

      {/* Organization */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide">Organization</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? "— " : ""}{c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Status</label>
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setField("isFeatured", e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Featured product</span>
        </label>
      </section>

      {/* Images */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide">Images</h2>
        <div className="flex flex-wrap gap-3">
          {form.images.map((url, i) => (
            <div key={i} className="relative group w-24 h-24">
              <img src={url} alt="" className="w-full h-full object-cover rounded border" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ×
              </button>
            </div>
          ))}
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-black transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            {uploading ? (
              <span className="text-xs text-gray-400">...</span>
            ) : (
              <Plus className="h-6 w-6 text-gray-400" />
            )}
          </label>
        </div>
      </section>

      {/* Variants */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide">Variants</h2>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="h-3 w-3 mr-1" /> Add Variant
          </Button>
        </div>
        <div className="space-y-4">
          {form.variants.map((variant, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-300" />
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Variant {index + 1}
                  </span>
                </div>
                {form.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input
                  label="SKU"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, { sku: e.target.value })}
                  required
                />
                <Input
                  label="Price (BDT)"
                  type="number"
                  step="0.01"
                  value={variant.price.toString()}
                  onChange={(e) => updateVariant(index, { price: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Sale Price (BDT)"
                  type="number"
                  step="0.01"
                  value={variant.salePrice.toString()}
                  onChange={(e) => updateVariant(index, { salePrice: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Stock"
                  type="number"
                  value={variant.stock.toString()}
                  onChange={(e) => updateVariant(index, { stock: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : initialData ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
