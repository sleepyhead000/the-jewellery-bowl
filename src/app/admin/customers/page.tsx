"use client";

import { useState, useEffect } from "react";
import { Search, Users } from "lucide-react";
import { Input, Pagination, Badge } from "@/components/ui";

interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  _count: { orders: number };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async (page = 1, q = search) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (q) params.set("search", q);
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setPagination(data.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(1, search);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase tracking-tight">Customers</h1>
        <Badge variant="default">{pagination.total} total</Badge>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 text-sm outline-none focus:border-black"
          />
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3 text-center">Orders</th>
              <th className="px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No customers found
              </td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium">{c.name || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-500">{c.phone || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-500">{c.email || "—"}</td>
                  <td className="px-5 py-3.5 text-center">
                    <Badge variant={c._count.orders > 0 ? "success" : "default"}>{c._count.orders}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={fetchCustomers} />
      )}
    </div>
  );
}
