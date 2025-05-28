#!/bin/bash
# Start development servers for django-blocknote

echo "🚀 Starting django-blocknote development servers..."

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Start Vite in watch mode
echo "📦 Starting Vite build watcher..."
cd frontend
npm run watch &
VITE_PID=$!
cd ..

# Wait a moment for Vite to start
sleep 2

# Start Django development server
echo "🌐 Starting Django development server..."
cd examples/demo_project
python manage.py runserver &
DJANGO_PID=$!
cd ../..

echo ""
echo "✅ Development servers started!"
echo "🔗 Django app: http://127.0.0.1:8000"
echo "🔗 Admin: http://127.0.0.1:8000/admin (admin/admin)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $VITE_PID $DJANGO_PID
