"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import { MapPin, Plus, Truck, CreditCard, CheckCircle } from "lucide-react";

interface Address {
  id: string;
  label: string | null;
  division: string;
  district: string;
  area: string | null;
  street: string;
  postalCode: string | null;
  phone: string;
  isDefault: boolean;
}

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
}

const BD_DIVISIONS = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total: subtotal, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"BKASH" | "NAGAD" | "COD">("BKASH");
  const [transactionId, setTransactionId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [notes, setNotes] = useState("");

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: "", division: "", district: "", area: "", street: "", postalCode: "", phone: "" });

  const [placing, setPlacing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/addresses").then((r) => r.json()),
      fetch("/api/shipping-zones").then((r) => r.json()),
      fetch("/api/payment-accounts").then((r) => r.json()),
    ]).then(([addrs, zns, accts]) => {
      setAddresses(addrs);
      setZones(zns);
      setPaymentAccounts(accts);
      const def = addrs.find((a: Address) => a.isDefault);
      if (def) setSelectedAddress(def.id);
    });
  }, []);

  const address = addresses.find((a) => a.id === selectedAddress);
  const matchedZone = address
    ? zones.find((z) => z.divisions.some((d) => d.toLowerCase() === address.division.toLowerCase()))
    : null;
  const shippingCost = matchedZone?.flatRate ?? 0;
  const grandTotal = subtotal + shippingCost;

  const activeAccount = paymentAccounts.find((a) => a.method === paymentMethod);

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAddr, isDefault: addresses.length === 0 }),
    });
    if (res.ok) {
      const addr = await res.json();
      setAddresses((prev) => [...prev, addr]);
      setSelectedAddress(addr.id);
      setShowAddressForm(false);
      setNewAddr({ label: "", division: "", district: "", area: "", street: "", postalCode: "", phone: "" });
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("files", e.target.files[0]);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setScreenshotUrl(data.files[0]?.url || "");
    }
    setUploading(false);
  };

  const placeOrder = async () => {
    if (!selectedAddress) { setError("Please select a shipping address"); return; }
    if ((paymentMethod === "BKASH" || paymentMethod === "NAGAD") && !transactionId.trim()) {
      setError("Please enter the transaction ID");
      return;
    }

    setPlacing(true);
    setError("");

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressId: selectedAddress,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        senderPhone: senderPhone.trim() || undefined,
        screenshotUrl: screenshotUrl || undefined,
        couponCode: couponCode.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      await clearCart();
      router.push(`/order-confirmation/${data.orderId}`);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to place order");
    }
    setPlacing(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 pb-28 text-center">
        <p className="text-gray-500">Your cart is empty</p>
        <Button onClick={() => router.push("/products")} className="mt-4">Shop Now</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-12 pb-28 md:pb-12">
      <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight mb-6 sm:mb-8">Checkout</h1>

      {/* Steps indicator */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1 text-sm sm:mb-10">
        {["Address", "Payment", "Review"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => step > i + 1 && setStep(i + 1)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                step > i + 1 ? "bg-black text-white border-black" :
                step === i + 1 ? "border-black text-black" :
                "border-gray-300 text-gray-400"
              }`}
            >
              {step > i + 1 ? "✓" : i + 1}
            </button>
            <span className={`whitespace-nowrap ${step >= i + 1 ? "text-black font-medium" : "text-gray-400"}`}>{label}</span>
            {i < 2 && <div className="h-px w-5 shrink-0 bg-gray-300 sm:w-8" />}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Main content */}
        <div className="flex-1">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Shipping Address
              </h2>

              {addresses.length > 0 && (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddress === addr.id ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                        className="mt-1"
                      />
                      <div className="text-sm">
                        {addr.label && <span className="font-medium">{addr.label} — </span>}
                        <span>{addr.street}, {addr.area && `${addr.area}, `}{addr.district}, {addr.division}</span>
                        <span className="block text-gray-400 text-xs mt-0.5">Phone: {addr.phone}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {showAddressForm ? (
                <form onSubmit={addAddress} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <Input label="Label (optional)" value={newAddr.label} onChange={(e) => setNewAddr((a) => ({ ...a, label: e.target.value }))} placeholder="Home, Office..." />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-2">Division</label>
                      <select value={newAddr.division} onChange={(e) => setNewAddr((a) => ({ ...a, division: e.target.value }))} className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" required>
                        <option value="">Select...</option>
                        {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <Input label="District" value={newAddr.district} onChange={(e) => setNewAddr((a) => ({ ...a, district: e.target.value }))} required />
                  </div>
                  <Input label="Area" value={newAddr.area} onChange={(e) => setNewAddr((a) => ({ ...a, area: e.target.value }))} />
                  <Input label="Street Address" value={newAddr.street} onChange={(e) => setNewAddr((a) => ({ ...a, street: e.target.value }))} required />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="Postal Code" value={newAddr.postalCode} onChange={(e) => setNewAddr((a) => ({ ...a, postalCode: e.target.value }))} />
                    <Input label="Phone" value={newAddr.phone} onChange={(e) => setNewAddr((a) => ({ ...a, phone: e.target.value }))} required />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="submit" size="sm">Save Address</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddressForm(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowAddressForm(true)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
                  <Plus className="h-4 w-4" /> Add new address
                </button>
              )}

              <div className="pt-4">
                <Button onClick={() => { if (selectedAddress) setStep(2); else setError("Please select an address"); }} disabled={!selectedAddress} className="w-full sm:w-auto">
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment Method
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(["BKASH", "NAGAD", "COD"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`min-h-11 px-4 sm:px-6 py-3 border text-sm font-medium transition-colors ${
                      paymentMethod === method ? "border-black bg-black text-white" : "border-gray-300 hover:border-black"
                    }`}
                  >
                    {method === "COD" ? "Cash on Delivery" : method === "BKASH" ? "bKash" : "Nagad"}
                  </button>
                ))}
              </div>

              {(paymentMethod === "BKASH" || paymentMethod === "NAGAD") && (
                <div className="border border-gray-200 rounded-lg p-4 sm:p-6 space-y-4">
                  {activeAccount ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm font-medium">
                        Send <span className="font-bold">{formatPrice(grandTotal)}</span> to:
                      </p>
                      <p className="text-2xl font-bold font-mono mt-2">{activeAccount.accountNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activeAccount.accountName || paymentMethod} — {paymentMethod === "BKASH" ? "bKash" : "Nagad"} Personal
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">No {paymentMethod} account configured. Please contact support.</p>
                  )}

                  <Input
                    label="Transaction ID *"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. ABC123XYZ"
                    required
                  />
                  <Input
                    label="Sender Phone Number"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2">Screenshot (optional)</label>
                    <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="text-sm" />
                    {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
                    {screenshotUrl && <p className="text-xs text-green-600 mt-1">Screenshot uploaded ✓</p>}
                  </div>
                </div>
              )}

              {paymentMethod === "COD" && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    You will pay <span className="font-bold">{formatPrice(grandTotal)}</span> in cash when your order is delivered.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button onClick={() => setStep(3)} className="w-full sm:w-auto">Review Order</Button>
                <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto">Back</Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Order Review
              </h2>

              {/* Address summary */}
              {address && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Shipping to</p>
                  <p className="text-sm">
                    {address.street}, {address.area && `${address.area}, `}{address.district}, {address.division}
                  </p>
                  <p className="text-xs text-gray-400">Phone: {address.phone}</p>
                </div>
              )}

              {/* Items */}
              <div className="border border-gray-200 rounded-lg divide-y">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-4">
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{item.product.name}</span>
                      <span className="text-gray-400 ml-2">× {item.quantity}</span>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(item.variant.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="border border-gray-300 px-4 py-2 text-sm outline-none focus:border-black flex-1"
                />
              </div>

              {/* Notes */}
              <textarea
                placeholder="Order notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black resize-none"
                rows={2}
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button onClick={placeOrder} disabled={placing} className="w-full sm:w-auto">
                  {placing ? "Placing Order..." : "Place Order"}
                </Button>
                <Button variant="outline" onClick={() => setStep(2)} className="w-full sm:w-auto">Back</Button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 space-y-3 lg:sticky lg:top-4">
            <h3 className="text-sm font-bold uppercase tracking-wide">Summary</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal ({items.length} items)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{shippingCost ? formatPrice(shippingCost) : <span className="text-xs text-gray-400">Select address</span>}</span>
              </div>
              {matchedZone && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Truck className="h-3 w-3" /> {matchedZone.name}
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-sm">
              <span>Total</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
