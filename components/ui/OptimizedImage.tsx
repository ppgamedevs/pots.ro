import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  className,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          fill ? 'w-full h-full' : '',
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-sm">Imagine indisponibilă</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div 
          className={cn(
            'absolute inset-0 bg-gray-200 animate-pulse',
            fill ? 'w-full h-full' : ''
          )}
          style={!fill ? { width, height } : undefined}
        />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  );
}

// Componente specializate pentru cazuri comune
export function ProductImage({ 
  src, 
  alt, 
  className 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      className={cn('aspect-[4/5] rounded-lg', className)}
      quality={90}
    />
  );
}

export function HeroImage({ 
  src, 
  alt, 
  className 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      sizes="100vw"
      priority
      className={cn('aspect-[16/9]', className)}
      quality={95}
    />
  );
}

export function ThumbnailImage({ 
  src, 
  alt, 
  className 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={64}
      height={64}
      sizes="64px"
      className={cn('rounded-md', className)}
      quality={80}
    />
  );
}

export function AvatarImage({ 
  src, 
  alt, 
  className 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={40}
      height={40}
      sizes="40px"
      className={cn('rounded-full', className)}
      quality={85}
    />
  );
}

export function BlogImage({ 
  src, 
  alt, 
  caption,
  className 
}: { 
  src: string; 
  alt: string; 
  caption?: string;
  className?: string; 
}) {
  return (
    <figure className={cn('my-8', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={720}
        height={400}
        sizes="(max-width: 768px) 100vw, 720px"
        className="rounded-lg border border-gray-200"
        quality={90}
      />
      {caption && (
        <figcaption className="text-sm text-gray-600 mt-2 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
