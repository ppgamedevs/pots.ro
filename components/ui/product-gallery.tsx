"use client";
import * as React from "react";
import Image from "next/image";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

export interface ProductGalleryProps {
  images: string[];
  title: string;
  discountPercentage?: number;
  className?: string;
}

const ProductGallery = React.forwardRef<HTMLDivElement, ProductGalleryProps>(
  ({ images, title, discountPercentage, className, ...props }, ref) => {
    const [selectedImage, setSelectedImage] = React.useState(0);

    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        {/* Main Image */}
        <div className="aspect-square relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10">
          <Image
            src={images[selectedImage]}
            alt={title}
            fill
            className="object-cover"
            priority
          />
          {discountPercentage && discountPercentage > 0 && (
            <Badge variant="destructive" className="absolute top-4 left-4">
              -{discountPercentage}%
            </Badge>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                  selectedImage === index
                    ? "border-brand"
                    : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                )}
              >
                <Image
                  src={image}
                  alt={`${title} ${index + 1}`}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);
ProductGallery.displayName = "ProductGallery";

export { ProductGallery };
