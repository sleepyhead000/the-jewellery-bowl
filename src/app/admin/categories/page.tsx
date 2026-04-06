"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  sortOrder: number;
  parentId: string | null;
  children: Category[];
  _count: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", parentId: "", sortOrder: 0 });

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? "PATCH" : "POST";
    const url = editing ? `/api/categories/${editing.id}` : "/api/categories";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        parentId: form.parentId || null,
        sortOrder: form.sortOrder,
      }),
    });

    if (res.ok) {
      setModalOpen(false);
      setEditing(null);
      setForm({ name: "", parentId: "", sortOrder: 0 });
      fetchCategories();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) fetchCategories();
    else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, parentId: cat.parentId || "", sortOrder: cat.sortOrder });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", parentId: "", sortOrder: 0 });
    setModalOpen(true);
  };

  // Get top-level categories (those without parentId)
  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Manage product categories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wide text-gray-500">
                <th className="text-left px-6 py-4">Category</th>
                <th className="text-left px-6 py-4">Slug</th>
                <th className="text-center px-6 py-4">Products</th>
                <th className="text-center px-6 py-4">Order</th>
                <th className="text-right px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topLevel.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  depth={0}
                  allCategories={categories}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
              {topLevel.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No categories yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? "Edit Category" : "Add Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2">
              Parent Category
            </label>
            <select
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
            >
              <option value="">None (top-level)</option>
              {categories
                .filter((c) => c.id !== editing?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>
          <Input
            label="Sort Order"
            type="number"
            value={form.sortOrder.toString()}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">
              {editing ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CategoryRow({
  category,
  depth,
  allCategories,
  onEdit,
  onDelete,
}: {
  category: Category;
  depth: number;
  allCategories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}) {
  const children = allCategories.filter((c) => c.parentId === category.id);

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 24 }}>
            {depth > 0 && <span className="text-gray-300">└</span>}
            <span className="text-sm font-medium">{category.name}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">{category.slug}</td>
        <td className="px-6 py-4 text-sm text-gray-500 text-center">{category._count.products}</td>
        <td className="px-6 py-4 text-sm text-gray-500 text-center">{category.sortOrder}</td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => onEdit(category)} className="p-1.5 text-gray-400 hover:text-black transition-colors">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => onDelete(category.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {children.map((child) => (
        <CategoryRow
          key={child.id}
          category={child}
          depth={depth + 1}
          allCategories={allCategories}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
