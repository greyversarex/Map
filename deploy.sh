#!/bin/bash
set -e

echo "=== DEPLOY ECOMAP ==="
cd /var/www/ecomap

echo "1. Pulling latest code..."
git pull

echo "2. Installing dependencies..."
npm install --legacy-peer-deps

echo "3. Applying database migrations..."
npm run db:push

echo "4. Removing old dist..."
rm -rf dist

echo "5. Building client (Vite)..."
npx vite build

echo "6. Building server (esbuild)..."
npx esbuild server/index.ts \
  --platform=node \
  --bundle \
  --format=cjs \
  --outfile=dist/index.cjs \
  --minify \
  --define:process.env.NODE_ENV=\"production\" \
  --external:@google-cloud/* \
  --external:@hookform/* \
  --external:@radix-ui/* \
  --external:@tanstack/* \
  --external:@types/* \
  --external:@uppy/* \
  --external:@vitejs/* \
  --external:@replit/* \
  --external:@tailwindcss/* \
  --external:react \
  --external:react-dom \
  --external:wouter \
  --external:maplibre-gl \
  --external:react-map-gl \
  --external:recharts \
  --external:framer-motion \
  --external:lucide-react \
  --external:react-icons \
  --external:autoprefixer \
  --external:tailwindcss \
  --external:postcss \
  --external:vite \
  --external:tsx \
  --external:typescript \
  --external:drizzle-kit \
  --external:esbuild

echo "7. Verifying build..."
if [ ! -f "dist/index.cjs" ]; then
    echo "ERROR: dist/index.cjs not found!"
    exit 1
fi
echo "OK: dist/index.cjs exists"
ls -la dist/

echo "8. Restarting PM2..."
pm2 restart ecomap

sleep 3

echo "9. Checking logs..."
pm2 logs --lines 5 --nostream

echo ""
echo "=== DEPLOY COMPLETE ==="
echo "Check: https://ecomap.space"
