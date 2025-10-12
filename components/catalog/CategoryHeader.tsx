"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SrcSet {
  src: string;
  alt: string;
}

export interface CategoryHeaderProps {
  title: string;
  subtitle?: string;
  image?: SrcSet;
  productCount?: number;
}

export function CategoryHeader({ 
  title, 
  subtitle, 
  image, 
  productCount 
}: CategoryHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to homepage if no history
      router.push('/');
    }
  };

  return (
    <div className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Mobile Back Button */}
        <div className="mb-4 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 text-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Content */}
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold text-ink mb-3">
              {title}
            </h1>
            
            {subtitle && (
              <p className="text-lg text-muted leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            )}
            
            {productCount && (
              <p className="text-sm text-muted mt-2">
                {productCount} produse disponibile
              </p>
            )}
          </div>

          {/* Image */}
          {image && (
            <div className="lg:w-80 lg:flex-shrink-0">
              <div className="relative h-48 lg:h-64 rounded-lg overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
