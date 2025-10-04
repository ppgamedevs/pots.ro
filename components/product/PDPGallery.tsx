"use client";

import { useState } from "react";
import Image from "next/image";

export interface SrcSet {
  src: string;
  alt: string;
}

export interface PDPGalleryProps {
  images: SrcSet[];
  alt: string;
}

export function PDPGallery({ images, alt }: PDPGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-bg-soft rounded-lg flex items-center justify-center">
        <span className="text-muted">Imagine indisponibilă</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-bg rounded-lg overflow-hidden">
        <Image
          src={images[selectedImage].src}
          alt={alt}
          fill
          className="object-cover transition-micro hover:scale-105"
          priority={selectedImage === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        
        {/* Badge overlay pentru discount/nou */}
        <div className="absolute top-4 right-4">
          {/* Badge-uri vor fi adăugate dinamic */}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-square bg-bg rounded-lg overflow-hidden border-2 transition-micro ${
                selectedImage === index 
                  ? 'border-primary' 
                  : 'border-line hover:border-muted'
              }`}
            >
              <Image
                src={image.src}
                alt={`${alt} - imagine ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 12.5vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
