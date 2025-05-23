#!/bin/bash
set -e

echo "Building frontend assets for development with file watching..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

echo "Starting development build with file watching..."
echo "Press Ctrl+C to stop watching"
echo "Files will be automatically rebuilt when changed"

# Development build with watch mode
npm run dev

cd ..
