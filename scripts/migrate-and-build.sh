#!/bin/bash
set -e

echo "🔄 Running database migrations..."
npm run db:migrate

echo "✅ Migrations complete"
echo "🏗️ Starting Next.js build..."
npm run build

echo "✅ Build complete"
