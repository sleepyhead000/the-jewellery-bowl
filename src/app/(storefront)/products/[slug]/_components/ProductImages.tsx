"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  images: string[];
  name: string;
}

export default function ProductImages({ images, name }: Props) {
  const [selected, setSelected] = useState(0);
  const selectedIndex = images[selected] ? selected : 0;

  if (images.length === 0) {
    return (
      <div
        className="aspect-square border-[4px] bg-[var(--color-elevated)] flex items-center justify-center text-[var(--color-text-muted)] text-sm"
        style={{ borderColor: "var(--color-product-card-border)" }}
      >
        No image
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div
        className="relative aspect-square overflow-hidden border-[4px] bg-[var(--color-elevated)]"
        style={{ borderColor: "var(--color-product-card-border)" }}
      >
        <Image
          src={images[selectedIndex]}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative h-16 w-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden border-2 bg-[var(--color-elevated)] transition-colors ${
                i === selectedIndex ? "border-[var(--color-product-card-border)]" : "border-transparent hover:border-[var(--color-border)]"
              }`}
            >
              <Image src={img} alt={`${name} ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
