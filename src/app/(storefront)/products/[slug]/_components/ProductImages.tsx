"use client";

import { useState } from "react";
import Image from "next/image";
import { useEffect } from "react";

interface Props {
  images: string[];
  name: string;
}

export default function ProductImages({ images, name }: Props) {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    setSelected(0);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={images[selected]}
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
              className={`relative h-16 w-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden border-2 transition-colors ${
                i === selected ? "border-black" : "border-transparent hover:border-gray-300"
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
