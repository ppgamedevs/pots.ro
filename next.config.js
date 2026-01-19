// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self';",
    unoptimized: process.env.NODE_ENV === 'development', // Disable optimization in development
  },
  
  // Performance optimizations
  experimental: {
    serverComponentsExternalPackages: ["postgres"],
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Compression
  compress: true,
  
  // Bundle analyzer (uncomment to analyze bundle size)
  // bundleAnalyzer: {
  //   enabled: process.env.ANALYZE === 'true',
  // },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },

  // Rewrites to handle icon requests from browser extensions
  async rewrites() {
    return [
      {
        source: '/32.png',
        destination: '/api/block-icon?size=32',
      },
      {
        source: '/64.png',
        destination: '/api/block-icon?size=64',
      },
      {
        source: '/128.png',
        destination: '/api/block-icon?size=128',
      },
      {
        source: '/192.png',
        destination: '/api/block-icon?size=192',
      },
      {
        source: '/512.png',
        destination: '/api/block-icon?size=512',
      },
      {
        source: '/icon.png',
        destination: '/api/block-icon?size=icon',
      },
    ];
  },

  // SEO Redirects for old English URLs to new Romanian URLs
  async redirects() {
    return [
      // Account related redirects
      {
        source: '/favorites',
        destination: '/favorite',
        permanent: true, // 301 redirect for SEO
      },
      {
        source: '/profile',
        destination: '/profil',
        permanent: true,
      },
      {
        source: '/account/orders',
        destination: '/comenzi',
        permanent: true,
      },
      {
        source: '/account/settings',
        destination: '/setari',
        permanent: true,
      },
      {
        source: '/account/wishlist',
        destination: '/favorite',
        permanent: true,
      },
      
      // Shopping related redirects
      {
        source: '/cart',
        destination: '/cos',
        permanent: true,
      },
      {
        source: '/checkout',
        destination: '/finalizare',
        permanent: true,
      },
      
      // Navigation redirects
      {
        source: '/search',
        destination: '/cautare',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/autentificare',
        permanent: true,
      },
      {
        source: '/help',
        destination: '/ajutor',
        permanent: true,
      },
    ]
  }
}

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    hideSourceMaps: true,
    // Automatically inject the Sentry SDK into the page
    disableClientWebpackPlugin: false,
    disableServerWebpackPlugin: false,
  }
)
