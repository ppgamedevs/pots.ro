import React from 'react';

// LCP (Largest Contentful Paint) Optimization Helpers

export function preloadImage(src: string, sizes?: string, srcSet?: string): React.ReactElement {
  return (
    <link
      rel="preload"
      as="image"
      href={src}
      {...(srcSet && { imagesrcset: srcSet })}
      {...(sizes && { imagesizes: sizes })}
    />
  );
}

export function preconnectToCDN(hostname: string): React.ReactElement {
  return (
    <link
      rel="preconnect"
      href={`https://${hostname}`}
      crossOrigin="anonymous"
    />
  );
}

// Helper pentru generarea srcSet responsive
export function generateSrcSet(baseUrl: string, widths: number[] = [400, 800, 1200, 1600]): string {
  return widths
    .map(width => `${baseUrl}?w=${width}&h=${width}&fit=crop&crop=center ${width}w`)
    .join(', ');
}

// Helper pentru generarea sizes responsive
export function generateSizes(breakpoints: { [key: string]: string } = {
  '(max-width: 640px)': '100vw',
  '(max-width: 1024px)': '50vw',
  '(max-width: 1280px)': '33vw',
  'default': '25vw'
}): string {
  return Object.entries(breakpoints)
    .map(([condition, size]) => condition === 'default' ? size : `${condition} ${size}`)
    .join(', ');
}

// Helper pentru detectarea CDN-ului folosit
export function getCDNHostname(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    
    // Vercel Blob
    if (url.hostname.includes('vercel-storage.com') || url.hostname.includes('blob.vercel-storage.com')) {
      return 'blob.vercel-storage.com';
    }
    
    // Cloudinary
    if (url.hostname.includes('cloudinary.com')) {
      return 'res.cloudinary.com';
    }
    
    // AWS S3
    if (url.hostname.includes('amazonaws.com') || url.hostname.includes('s3.')) {
      return url.hostname;
    }
    
    // Supabase Storage
    if (url.hostname.includes('supabase.co')) {
      return url.hostname;
    }
    
    return null;
  } catch {
    return null;
  }
}

// Component pentru preconnect-uri automate
export function CDNPreconnects({ imageUrls }: { imageUrls: string[] }): React.ReactElement {
  const hostnames = new Set<string>();
  
  imageUrls.forEach(url => {
    const hostname = getCDNHostname(url);
    if (hostname) {
      hostnames.add(hostname);
    }
  });
  
  return (
    <>
      {Array.from(hostnames).map(hostname => (
        <React.Fragment key={hostname}>
          {preconnectToCDN(hostname)}
        </React.Fragment>
      ))}
    </>
  );
}

// Helper pentru optimizarea imaginii principale (LCP)
export function optimizeLCPImage({
  src,
  alt,
  priority = true,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className = 'w-full h-auto',
  ...props
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  [key: string]: any;
}): {
  preloadElement?: React.ReactElement;
  imageProps: any;
} {
  const srcSet = generateSrcSet(src);
  const hostname = getCDNHostname(src);
  
  const preloadElement = priority ? preloadImage(src, sizes, srcSet) : undefined;
  
  const imageProps = {
    src,
    alt,
    priority,
    sizes,
    className,
    ...props,
  };
  
  return {
    preloadElement,
    imageProps,
  };
}

// Helper pentru layout-uri cu imagini multiple
export function generateImageLayout({
  images,
  layout = 'grid',
  columns = 3,
}: {
  images: string[];
  layout?: 'grid' | 'carousel' | 'stack';
  columns?: number;
}): {
  preloadElements: React.ReactElement[];
  layoutProps: any;
} {
  const preloadElements = images.slice(0, 3).map((src, index) => 
    preloadImage(src, generateSizes({
      '(max-width: 640px)': '100vw',
      '(max-width: 1024px)': '50vw',
      'default': `${100 / columns}vw`
    }))
  );
  
  const layoutProps = {
    className: layout === 'grid' ? `grid grid-cols-${columns} gap-4` : 
               layout === 'carousel' ? 'flex overflow-x-auto gap-4' :
               'flex flex-col gap-4',
  };
  
  return {
    preloadElements,
    layoutProps,
  };
}
