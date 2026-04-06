import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Fatima R.",
    location: "Dhaka",
    rating: 5,
    text: "The leather case quality is exceptional. You can feel the premium craftsmanship the moment you hold it.",
    product: "iPhone 15 Pro Max Leather Case",
  },
  {
    name: "Arif K.",
    location: "Chittagong",
    rating: 5,
    text: "Fast delivery and the sunglasses exceeded my expectations. The polarized lenses are crystal clear.",
    product: "Premium Sunglasses UV400",
  },
  {
    name: "Nusrat J.",
    location: "Sylhet",
    rating: 5,
    text: "I ordered the crossbody bag as a gift and it was beautifully packaged. Absolutely worth every taka.",
    product: "Luxury Crossbody Bag",
  },
  {
    name: "Tanvir H.",
    location: "Rajshahi",
    rating: 4,
    text: "The smartwatch is feature-packed and looks way more expensive than its price. Great value for money.",
    product: "Smart Watch Series 9",
  },
];

export default function SocialProof() {
  return (
    <section className="container mx-auto px-4 md:px-8">
      <div className="text-center mb-12 space-y-3">
        <p className="text-xs tracking-[0.3em] text-accent uppercase font-body">Trusted by thousands</p>
        <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight font-display">
          What Our Customers Say
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="border border-gray-100 p-6 space-y-4 hover:border-gray-300 transition-colors"
          >
            {/* Stars */}
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${star <= t.rating ? "fill-accent text-accent" : "text-gray-200"}`}
                />
              ))}
            </div>

            {/* Review text */}
            <p className="text-sm text-gray-600 leading-relaxed font-body">
              &ldquo;{t.text}&rdquo;
            </p>

            {/* Author */}
            <div className="pt-2 border-t border-gray-50">
              <p className="text-sm font-semibold font-display">{t.name}</p>
              <p className="text-[11px] text-gray-400 font-body">
                {t.location} &middot; {t.product}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
