"use client";

import { useState, useEffect } from "react";
import { Star, Check, X, Trash2 } from "lucide-react";
import { Button, Badge, Pagination } from "@/components/ui";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  user: { name: string | null };
  product: { name: string; slug: string };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/reviews?filter=${filter}`);
    const data = await res.json();
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [filter]);

  const handleApprove = async (id: string) => {
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: true }),
    });
    fetchReviews();
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: false }),
    });
    fetchReviews();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold uppercase tracking-tight">Reviews</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`min-h-11 shrink-0 px-4 py-2 text-sm border transition-colors ${
              filter === f ? "bg-black text-white border-black" : "border-gray-200 hover:border-gray-400"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">No reviews found</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <Badge variant={review.isApproved ? "success" : "warning"}>
                      {review.isApproved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{review.product.name}</p>
                  <p className="text-xs text-gray-400">
                    by {review.user.name || "Anonymous"} · {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:flex">
                  {!review.isApproved && (
                    <Button size="sm" onClick={() => handleApprove(review.id)} title="Approve">
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {review.isApproved && (
                    <Button size="sm" variant="outline" onClick={() => handleReject(review.id)} title="Unapprove">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDelete(review.id)} className="text-red-500 border-red-200" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 mt-3 pl-0.5">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
