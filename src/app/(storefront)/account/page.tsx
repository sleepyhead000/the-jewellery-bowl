"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Save } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Record<string, string | null>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setMessage("Profile updated successfully");
    } else {
      const err = await res.json();
      setMessage(err.error || "Failed to update");
    }
    setSaving(false);
  };

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold uppercase tracking-tight mb-8">My Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <p className="font-medium">{profile.name || "—"}</p>
            <p className="text-sm text-gray-500">Member since {new Date(profile.createdAt || "").toLocaleDateString()}</p>
          </div>
        </div>

        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
        />

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Phone Number</label>
          <div className="flex items-center gap-2 px-4 py-3 border border-gray-200 bg-gray-50 text-sm text-gray-500">
            <Phone className="h-4 w-4" />
            {profile.phone || "—"}
          </div>
          <p className="text-xs text-gray-400 mt-1">Phone number cannot be changed</p>
        </div>

        {message && (
          <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-500"}`}>{message}</p>
        )}

        <Button type="submit" disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
