"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";

export interface SrcSet {
  src: string;
  alt: string;
  sizes?: string;
}

export interface LinkProps {
  href: string;
  label: string;
}

export interface PromoHeroProps {
  title: string;
  subtitle?: string;
  image: SrcSet;
  video?: {
    src: string;
  };
  ctaPrimary: LinkProps;
  ctaSecondary?: LinkProps;
}

export function PromoHero({ title, subtitle, image, video, ctaPrimary, ctaSecondary }: PromoHeroProps) {
  return (
    <section className="relative h-[540px] lg:h-[540px] overflow-hidden rounded-lg">
      {/* Background Video or Image */}
      {video ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          preload="metadata"
        >
          <source src={video.src} type="video/mp4" />
          {/* Fallback to image if video fails to load */}
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 1440px"
          />
        </video>
      ) : (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1440px"
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
      
      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {title}
            </h1>
            
            {subtitle && (
              <p className="text-lg lg:text-xl text-white/90 mb-8 leading-relaxed">
                {subtitle}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={ctaPrimary.href}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white transition-micro">
                  {ctaPrimary.label}
                </Button>
              </Link>
              
              {ctaSecondary && (
                <Link href={ctaSecondary.href}>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-micro"
                  >
                    {ctaSecondary.label}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
