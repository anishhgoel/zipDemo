#!/bin/bash

# Zip-like Procurement System Demo Launcher
# This script starts both backend and frontend for easy demo

echo "🚀 Starting Zip-like Procurement System Demo..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Start backend in background
echo "🔧 Starting FastAPI backend..."
python3 main.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test if backend is running
echo "🔍 Testing backend connection..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:8000"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "🎨 Starting Next.js frontend..."
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo "🌐 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

echo ""
echo "🎉 Demo is ready!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:8000"
echo "📍 API Docs: http://localhost:8000/docs"
echo ""
echo "🎯 Demo Flow:"
echo "1. Open http://localhost:3000"
echo "2. Login as Alice Chen (Requester) to submit a request"
echo "3. Login as Bob Smith (Manager) to approve"
echo "4. Login as Fiona Davis (Finance) for high-value requests"
echo "5. Login as Lily Johnson (Legal) for new vendors"
echo "6. Login as Admin User to see all requests"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Demo stopped. Thanks for trying the Zip-like Procurement System!"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Keep script running
wait
