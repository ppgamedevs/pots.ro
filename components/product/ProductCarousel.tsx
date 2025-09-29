"use client";
import { useState } from "react";
import Image from "next/image";

type Img = { 
  url: string; 
  alt?: string; 
};

export default function ProductCarousel({ images }: { images: Img[] }) {
  const [idx, setIdx] = useState(0);
  
  if (!images?.length) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <span className="text-gray-400">Fără imagini</span>
      </div>
    );
  }
  
  const current = images[idx];

  return (
    <div>
      {/* Imaginea principală */}
      <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 relative">
        <Image
          src={current.url}
          alt={current.alt || `Imaginea ${idx + 1} din ${images.length} - imagine produs`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          className="object-cover"
          priority={idx === 0}
          quality={90}
        />
      </div>
      
      {/* Thumbnails */}
      <div className="mt-3 grid grid-cols-5 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
              i === idx 
                ? "border-brand ring-2 ring-brand/20" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            aria-label={`Pagina ${i + 1} din ${images.length}`}
          >
            <Image
              src={img.url}
              alt={img.alt || `Miniatură ${i + 1} din ${images.length}`}
              width={100}
              height={100}
              className="w-full h-full object-cover"
              quality={75}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
