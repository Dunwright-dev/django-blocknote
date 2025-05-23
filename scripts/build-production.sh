#!/bin/bash
set -e

echo "Building frontend assets for production..."
cd frontend

# Install dependencies
echo "Installing npm dependencies..."
npm ci  # Use ci for reproducible builds

# Clean previous builds
echo "Cleaning previous builds..."
npm run clean

# Production build with optimizations
echo "Building optimized assets..."
npm run build

# Optional: Run tests
# npm test

cd ..

echo "Production assets built successfully!"
echo "Generated files:"
ls -la django_blocknote/static/django_blocknote/js/
ls -la django_blocknote/static/django_blocknote/css/

# Show file sizes
echo "File sizes:"
du -h django_blocknote/static/django_blocknote/js/*
du -h django_blocknote/static/django_blocknote/css/*
