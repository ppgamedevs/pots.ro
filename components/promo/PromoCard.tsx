"use client";

import Link from "next/link";
import Image from "next/image";
import { SrcSet } from "./PromoHero";

export interface PromoCardProps {
  title: string;
  image: SrcSet;
  href: string;
  tone?: 'light' | 'dark';
}

export function PromoCard({ title, image, href, tone = 'light' }: PromoCardProps) {
  const textColor = tone === 'dark' ? 'text-white' : 'text-ink';
  const overlayClass = tone === 'dark' 
    ? 'bg-gradient-to-t from-black/60 via-black/20 to-transparent'
    : 'bg-gradient-to-t from-black/40 via-transparent to-transparent';

  return (
    <Link href={href} className="group block">
      <div className="relative h-60 lg:h-80 overflow-hidden rounded-lg transition-micro group-hover:scale-[1.02]">
        {/* Background Image */}
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover transition-micro group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 600px"
        />
        
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 ${overlayClass}`} />
        
        {/* Content */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className={`text-xl lg:text-2xl font-semibold ${textColor} mb-2`}>
            {title}
          </h3>
          
          <div className={`text-sm ${textColor} opacity-90`}>
            Descoperă colecția
          </div>
        </div>
      </div>
    </Link>
  );
}
