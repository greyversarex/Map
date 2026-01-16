#!/bin/bash
set -e

echo "=== DEPLOY ECOMAP ==="
echo ""

cd /var/www/ecomap

echo "1. Pulling latest code..."
git pull

echo ""
echo "2. Installing dependencies..."
npm install --legacy-peer-deps

echo ""
echo "3. Applying database migrations..."
npm run db:push

echo ""
echo "4. Building application..."
./node_modules/.bin/tsx script/build.ts

echo ""
echo "5. Verifying build..."
if [ ! -f "dist/index.cjs" ]; then
    echo "ERROR: dist/index.cjs not found!"
    echo "Build failed. Check the errors above."
    exit 1
fi

echo "dist/index.cjs exists - OK"

echo ""
echo "6. Restarting PM2..."
pm2 restart ecomap

echo ""
echo "7. Waiting 3 seconds for startup..."
sleep 3

echo ""
echo "8. Checking status..."
pm2 status

echo ""
echo "=== DEPLOY COMPLETE ==="
echo "Check: https://ecomap.space"
