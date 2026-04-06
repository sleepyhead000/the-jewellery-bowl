"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Megaphone, GripVertical } from "lucide-react";
import { Button, Input, Badge, Modal } from "@/components/ui";

interface Announcement {
  id: string;
  text: string;
  link: string | null;
  isActive: boolean;
  sortOrder: number;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
}

const emptyForm = { text: "", link: "", isActive: true, sortOrder: 0, startAt: "", endAt: "" };

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/announcements");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({
      text: a.text,
      link: a.link || "",
      isActive: a.isActive,
      sortOrder: a.sortOrder,
      startAt: a.startAt ? a.startAt.slice(0, 16) : "",
      endAt: a.endAt ? a.endAt.slice(0, 16) : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.text.trim()) return;
    setSaving(true);

    const payload = {
      text: form.text,
      link: form.link || null,
      isActive: form.isActive,
      sortOrder: form.sortOrder,
      startAt: form.startAt || null,
      endAt: form.endAt || null,
    };

    if (editing) {
      await fetch(`/api/admin/announcements/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    setShowModal(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const toggleActive = async (a: Announcement) => {
    await fetch(`/api/admin/announcements/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !a.isActive }),
    });
    fetchAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6" />
          <h1 className="text-2xl font-bold uppercase tracking-tight">Announcements</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Announcement
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No announcements yet</p>
          <p className="text-xs mt-1">Create one to display on the storefront header</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-4 p-4 bg-white border rounded-lg ${
                !a.isActive ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{a.text}</p>
                <div className="flex items-center gap-3 mt-1">
                  {a.link && (
                    <span className="text-xs text-gray-400 truncate max-w-48">{a.link}</span>
                  )}
                  {a.startAt && (
                    <span className="text-xs text-gray-400">
                      From: {new Date(a.startAt).toLocaleDateString()}
                    </span>
                  )}
                  {a.endAt && (
                    <span className="text-xs text-gray-400">
                      Until: {new Date(a.endAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant={a.isActive ? "success" : "default"}>
                {a.isActive ? "Active" : "Inactive"}
              </Badge>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleActive(a)}
                  className="p-2 text-gray-400 hover:text-gray-600 text-xs"
                  title={a.isActive ? "Deactivate" : "Activate"}
                >
                  {a.isActive ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => openEdit(a)}
                  className="p-2 text-gray-400 hover:text-blue-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h2 className="text-lg font-bold mb-6">
          {editing ? "Edit Announcement" : "New Announcement"}
        </h2>
        <div className="space-y-4">
          <Input
            label="Announcement Text"
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            placeholder="e.g. Up to 10K BDT 10% Off"
          />
          <Input
            label="Link URL (optional)"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="/products or https://..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              value={String(form.sortOrder)}
              onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
            />
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                Start Date (optional)
              </label>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-gray-200 focus:border-black focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                End Date (optional)
              </label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-gray-200 focus:border-black focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving || !form.text.trim()} className="flex-1">
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
            <Button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
