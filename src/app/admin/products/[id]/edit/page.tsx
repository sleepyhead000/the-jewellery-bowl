"use client";

import { useState, useEffect, use } from "react";
import ProductForm from "../../_components/ProductForm";

interface Props {
  params: Promise<{ id: string }>;
}

function toDateTimeLocal(value: unknown): string {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function EditProductPage({ params }: Props) {
  const { id } = use(params);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight">Edit Product</h1>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight">Product Not Found</h1>
      </div>
    );
  }

  const initialData = {
    id: product.id as string,
    name: product.name as string,
    description: (product.description as string) || "",
    basePrice: (product.basePrice as number) / 100,
    categoryId: (product.categoryId as string) || "",
    status: product.status as string,
    isFeatured: product.isFeatured as boolean,
    tags: ((product.tags as string[]) || []).join(", "),
    images: ((product.images as Array<{ url: string }>) || []).map((img) => img.url),
    variants: ((product.variants as Array<Record<string, unknown>>) || []).map((v) => ({
      id: v.id as string,
      displayName: ((v.attributes as Record<string, string> | null)?.displayName as string) || "",
      sku: (v.sku as string) || "",
      price: (v.price as number) / 100,
      salePrice: v.salePrice ? (v.salePrice as number) / 100 : 0,
      saleEnabled: Boolean(v.saleEnabled),
      saleStartsAt: toDateTimeLocal(v.saleStartsAt),
      saleEndsAt: toDateTimeLocal(v.saleEndsAt),
      saleDiscountType: v.saleDiscountType === "PERCENT" ? "PERCENT" as const : "PRICE" as const,
      saleDiscountValue:
        v.saleDiscountType === "PERCENT"
          ? (v.saleDiscountValue as number | null) ?? 0
          : ((v.saleDiscountValue as number | null) ?? (v.salePrice as number | null) ?? 0) / 100,
      stock: v.stock as number,
      attributes: (v.attributes as Record<string, string>) || {},
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Edit Product</h1>
        <p className="text-gray-500 text-sm mt-1">{product.name as string}</p>
      </div>
      <ProductForm initialData={initialData} />
    </div>
  );
}
