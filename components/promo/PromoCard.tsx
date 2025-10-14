"use client";

import Link from "next/link";
import Image from "next/image";
import { SrcSet } from "./PromoHero";

export interface PromoCardProps {
  title: string;
  subtitle?: string;
  image: SrcSet;
  href: string;
  tone?: 'light' | 'dark';
  size?: 'large' | 'small';
  ctaPrimary?: {
    label: string;
    href: string;
  };
}

export function PromoCard({ title, subtitle, image, href, tone = 'light', size = 'large', ctaPrimary }: PromoCardProps) {
  const textColor = tone === 'dark' ? 'text-white' : 'text-ink';
  const overlayClass = tone === 'dark' 
    ? 'bg-gradient-to-t from-black/60 via-black/20 to-transparent'
    : 'bg-gradient-to-t from-black/40 via-transparent to-transparent';

  // Dimensiuni uniforme pentru carduri - cardul mare să fie exact înălțimea celor două carduri mici + gap
  const heightClass = size === 'large' 
    ? 'h-80 sm:h-96 lg:h-[29rem]' // Înălțime care să se alinieze perfect cu cele două carduri mici + gap (2 * 14rem + 1rem gap)
    : 'h-40 sm:h-48 lg:h-56'; // Înălțime uniformă pentru toate cardurile mici

  return (
    <Link href={href} className="group block">
      <div className={`relative ${heightClass} overflow-hidden rounded-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl`}>
        {/* Background Image */}
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover transition-all duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw"
          priority={size === 'large'}
          quality={size === 'large' ? 85 : 75}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
        
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 ${overlayClass}`} />
        
        {/* Discount Badge */}
        {title === 'Reducerile lunii' && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
            până la -30%
          </div>
        )}
        
        {/* Content */}
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
          {/* Hide title and subtitle for "Reducerile lunii" card */}
          {title !== 'Reducerile lunii' && (
            <>
              <h3 className={`text-lg sm:text-xl lg:text-2xl font-semibold ${textColor} mb-1 sm:mb-2`}>
                {title}
              </h3>
              
              {subtitle && (
                <p className={`text-xs sm:text-sm ${textColor} opacity-90 mb-2 sm:mb-3 max-w-md`}>
                  {subtitle}
                </p>
              )}
            </>
          )}
          
          {ctaPrimary ? (
            <div className={`text-xs sm:text-sm font-medium ${textColor} opacity-90 hover:opacity-100 transition-opacity`}>
              {ctaPrimary.label}
            </div>
          ) : (
            <div className={`text-xs sm:text-sm ${textColor} opacity-90`}>
              Descoperă colecția
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
