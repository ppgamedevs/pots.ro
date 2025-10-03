module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/c/ghiveci',
        'http://localhost:3000/c/cutii',
        'http://localhost:3000/c/accesorii',
        'http://localhost:3000/p/ghiveci-ceramic-inalt',
        'http://localhost:3000/p/cutie-plastic-balbona',
        'http://localhost:3000/checkout',
        'http://localhost:3000/seller/dashboard',
        'http://localhost:3000/seller/products',
        'http://localhost:3000/seller/analytics',
        'http://localhost:3000/seller/promotions',
        'http://localhost:3000/admin/dashboard',
        'http://localhost:3000/admin/analytics',
        'http://localhost:3000/admin/finante',
        'http://localhost:3000/admin/users',
        'http://localhost:3000/legal/termeni',
        'http://localhost:3000/legal/privacy',
        'http://localhost:3000/legal/livrare',
        'http://localhost:3000/legal/retur',
        'http://localhost:3000/legal/contact'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.90 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.90 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3500 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
