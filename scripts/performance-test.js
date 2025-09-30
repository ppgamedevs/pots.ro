#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting performance test...\n');

// Test URLs
const urls = [
  'http://localhost:3000',
  'http://localhost:3000/c/ghivece',
  'http://localhost:3000/p/1-ghiveci-ceramic-alb',
];

// Lighthouse configuration
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      'largest-contentful-paint',
      'first-contentful-paint',
      'cumulative-layout-shift',
      'speed-index',
      'total-blocking-time',
      'interactive',
    ],
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
    },
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
    },
  },
};

async function runLighthouse(url) {
  try {
    console.log(`📊 Testing ${url}...`);
    
    const command = `npx lighthouse "${url}" --output=json --chrome-flags="--headless" --config-path=./lighthouse-config.json`;
    
    // Create lighthouse config file
    fs.writeFileSync('./lighthouse-config.json', JSON.stringify(lighthouseConfig, null, 2));
    
    const result = execSync(command, { encoding: 'utf8' });
    const data = JSON.parse(result);
    
    const audits = data.lhr.audits;
    const metrics = {
      url,
      lcp: audits['largest-contentful-paint'].numericValue,
      fcp: audits['first-contentful-paint'].numericValue,
      cls: audits['cumulative-layout-shift'].numericValue,
      si: audits['speed-index'].numericValue,
      tbt: audits['total-blocking-time'].numericValue,
      tti: audits['interactive'].numericValue,
    };
    
    console.log(`✅ ${url}:`);
    console.log(`   LCP: ${metrics.lcp.toFixed(0)}ms (target: ≤2500ms)`);
    console.log(`   FCP: ${metrics.fcp.toFixed(0)}ms`);
    console.log(`   CLS: ${metrics.cls.toFixed(3)} (target: ≤0.1)`);
    console.log(`   SI: ${metrics.si.toFixed(0)}ms`);
    console.log(`   TBT: ${metrics.tbt.toFixed(0)}ms`);
    console.log(`   TTI: ${metrics.tti.toFixed(0)}ms`);
    console.log('');
    
    return metrics;
  } catch (error) {
    console.error(`❌ Error testing ${url}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🔍 Checking if server is running...');
  
  try {
    execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'pipe' });
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Server is not running. Please start it with: npm run dev');
    process.exit(1);
  }
  
  const results = [];
  
  for (const url of urls) {
    const metrics = await runLighthouse(url);
    if (metrics) {
      results.push(metrics);
    }
  }
  
  // Clean up
  if (fs.existsSync('./lighthouse-config.json')) {
    fs.unlinkSync('./lighthouse-config.json');
  }
  
  // Summary
  console.log('📋 Performance Summary:');
  console.log('=====================');
  
  const lcpResults = results.map(r => ({ url: r.url, lcp: r.lcp }));
  const avgLcp = lcpResults.reduce((sum, r) => sum + r.lcp, 0) / lcpResults.length;
  
  console.log(`Average LCP: ${avgLcp.toFixed(0)}ms`);
  
  const lcpPassed = lcpResults.every(r => r.lcp <= 2500);
  console.log(`LCP Target (≤2500ms): ${lcpPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (!lcpPassed) {
    console.log('\n🔧 Recommendations:');
    console.log('- Optimize images with next/image');
    console.log('- Add priority to hero images');
    console.log('- Use proper sizes attributes');
    console.log('- Implement lazy loading for below-the-fold content');
    console.log('- Consider using WebP/AVIF formats');
  }
  
  console.log('\n✨ Performance test completed!');
}

main().catch(console.error);
