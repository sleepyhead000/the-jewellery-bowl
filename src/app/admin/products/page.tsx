"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Eye, Package, Copy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button, Badge, Pagination } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  status: string;
  isFeatured: boolean;
  images: { id: string; url: string }[];
  category: { id: string; name: string } | null;
  variants: { id: string; stock: number; salePrice: number | null }[];
  _count: { reviews: number };
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminProductsPage() {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    const res = await fetch(`/api/products?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => {
    void Promise.resolve().then(fetchProducts);
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) fetchProducts();
  };

  const handleCopy = async (id: string) => {
    setCopyingId(id);
    try {
      const res = await fetch(`/api/products/${id}/copy`, { method: "POST" });

      if (res.ok) {
        await fetchProducts();
        return;
      }

      const data = await res.json().catch(() => ({ error: "Failed to copy product" }));
      alert(data.error || "Failed to copy product");
    } finally {
      setCopyingId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const totalStock = (variants: { stock: number }[]) =>
    variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Products</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data ? `${data.total} product${data.total !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="min-h-11 w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-black sm:w-64"
          />
          <Button type="submit" variant="outline" size="sm" className="w-full sm:w-auto">Search</Button>
        </form>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="min-h-11 w-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-black sm:w-auto"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="grid gap-3 lg:hidden">
        {loading ? (
          <div className="border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">Loading...</div>
        ) : data?.products.length === 0 ? (
          <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />No products found
          </div>
        ) : (
          data?.products.map((product) => (
            <article key={product.id} className="border border-gray-200 bg-white p-4">
              <div className="flex gap-3">
                {product.images[0] ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 shrink-0 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-gray-100">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                  <p className="mt-1 text-xs text-gray-400">{product.category?.name || "No category"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={product.status === "ACTIVE" ? "success" : product.status === "DRAFT" ? "default" : "warning"}>{product.status}</Badge>
                    {product.isFeatured ? <span className="text-[10px] font-bold uppercase text-amber-600">Featured</span> : null}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="block text-xs font-bold uppercase text-gray-400">Price</span>{formatPrice(product.basePrice)}</div>
                <div><span className="block text-xs font-bold uppercase text-gray-400">Stock</span>{totalStock(product.variants)}</div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                <Link href={`/products/${product.slug}`} target="_blank"><Button variant="outline" size="sm" className="w-full"><Eye className="h-4 w-4" /></Button></Link>
                <Link href={`/admin/products/${product.id}/edit`}><Button variant="outline" size="sm" className="w-full"><Pencil className="h-4 w-4" /></Button></Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(product.id)}
                  disabled={copyingId === product.id}
                  className="w-full"
                >
                  <Copy className={`h-4 w-4 ${copyingId === product.id ? "animate-pulse" : ""}`} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)} className="w-full text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Table */}
      <div className="hidden bg-white border border-gray-200 rounded-lg overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wide text-gray-500">
                <th className="text-left px-6 py-4">Product</th>
                <th className="text-left px-6 py-4">Category</th>
                <th className="text-right px-6 py-4">Price</th>
                <th className="text-center px-6 py-4">Stock</th>
                <th className="text-center px-6 py-4">Status</th>
                <th className="text-right px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Loading...
                  </td>
                </tr>
              ) : data?.products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No products found
                  </td>
                </tr>
              ) : (
                data?.products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium">{product.name}</div>
                          {product.isFeatured && (
                            <span className="text-[10px] uppercase tracking-wide text-amber-600 font-bold">Featured</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.category?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium">{formatPrice(product.basePrice)}</div>
                      {product.variants[0]?.salePrice && (
                        <div className="text-xs text-gray-400 line-through">
                          {formatPrice(product.variants[0].salePrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${totalStock(product.variants) <= 5 ? "text-red-500" : "text-gray-700"}`}>
                        {totalStock(product.variants)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={product.status === "ACTIVE" ? "success" : product.status === "DRAFT" ? "default" : "warning"}>
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/products/${product.slug}`} target="_blank">
                          <button className="p-1.5 text-gray-400 hover:text-black transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <button className="p-1.5 text-gray-400 hover:text-black transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleCopy(product.id)}
                          disabled={copyingId === product.id}
                          className="p-1.5 text-gray-400 hover:text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Copy className={`h-4 w-4 ${copyingId === product.id ? "animate-pulse" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.totalPages > 1 && (
        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
