#!/usr/bin/env node

console.log('🔧 Environment Variables Test\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('📊 Environment Variables Status:');
console.log('================================');

// Check REVALIDATE_SECRET
const revalidateSecret = process.env.REVALIDATE_SECRET;
if (revalidateSecret) {
  console.log('✅ REVALIDATE_SECRET: Set');
  console.log(`   Value: ${revalidateSecret.substring(0, 8)}...`);
} else {
  console.log('❌ REVALIDATE_SECRET: Not set');
}

// Check NEXT_PUBLIC_BASE_URL
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
if (baseUrl) {
  console.log('✅ NEXT_PUBLIC_BASE_URL: Set');
  console.log(`   Value: ${baseUrl}`);
} else {
  console.log('❌ NEXT_PUBLIC_BASE_URL: Not set');
}

// Check Supabase variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n📊 Supabase Configuration:');
if (supabaseUrl) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL: Set');
} else {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_URL: Not set (optional for now)');
}

if (supabaseAnonKey) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Set');
} else {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY: Not set (optional for now)');
}

if (supabaseServiceKey) {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY: Set');
} else {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY: Not set (optional for now)');
}

console.log('\n🎯 ISR & Revalidation Ready:');
if (revalidateSecret && baseUrl) {
  console.log('✅ All required environment variables are set');
  console.log('✅ ISR and revalidation will work correctly');
  console.log('✅ Webhook endpoints are ready');
} else {
  console.log('❌ Missing required environment variables');
  console.log('❌ ISR and revalidation may not work correctly');
}

console.log('\n📝 To create .env.local file:');
console.log('1. Copy env.local.example to .env.local');
console.log('2. Or create .env.local manually with the values above');
console.log('3. Restart the development server');

console.log('\n✨ Environment test completed!');
