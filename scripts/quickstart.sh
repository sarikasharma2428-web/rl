#!/bin/bash

# AutoDeployX Quick Start Script
# This script starts all required services for AutoDeployX

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           🚀 AutoDeployX Quick Start Script                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        return 1
    fi
    print_status "$1 found"
    return 0
}

check_command "python3" || exit 1
check_command "docker" || exit 1
check_command "kubectl" || exit 1
check_command "minikube" || exit 1

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "📁 Working directory: $SCRIPT_DIR"

# Check if .env exists
if [ ! -f "autodeploy/.env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp autodeploy/.env.example autodeploy/.env
    echo "⚠️  Please edit autodeploy/.env with your configuration"
    echo "   Required: JENKINS_TOKEN, DOCKERHUB_TOKEN"
    exit 1
fi

print_status ".env file found"

# Function to start service
start_service() {
    local service=$1
    local command=$2
    local check=$3
    
    echo ""
    echo "Starting $service..."
    
    # Check if already running
    if eval "$check" &>/dev/null; then
        print_status "$service is already running"
        return 0
    fi
    
    # Try to start
    eval "$command"
    
    # Wait and verify
    sleep 3
    if eval "$check" &>/dev/null; then
        print_status "$service started successfully"
        return 0
    else
        print_error "Failed to start $service"
        return 1
    fi
}

# Start Minikube
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "1️⃣  MINIKUBE"
echo "════════════════════════════════════════════════════════════════"

if minikube status &>/dev/null; then
    print_status "Minikube is already running"
else
    echo "Starting Minikube..."
    minikube start --driver=docker
fi

# Apply Kubernetes configs
echo ""
echo "Applying Kubernetes configurations..."
kubectl apply -f autodeploy/k8s/service.yaml
kubectl apply -f autodeploy/k8s/deployment.yaml
print_status "Kubernetes configs applied"

# Start Jenkins
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "2️⃣  JENKINS"
echo "════════════════════════════════════════════════════════════════"

if docker ps --filter "name=jenkins" --format "{{.Names}}" | grep -q jenkins; then
    print_status "Jenkins is already running"
else
    print_warning "Jenkins not running. Starting..."
    docker run -d \
        --name jenkins \
        -p 8080:8080 \
        -p 50000:50000 \
        -v jenkins_home:/var/jenkins_home \
        jenkins/jenkins:latest 2>/dev/null || true
    
    echo "Waiting for Jenkins to start (30 seconds)..."
    for i in {1..30}; do
        if curl -s http://localhost:8080 &>/dev/null; then
            print_status "Jenkins is ready"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    print_warning "Jenkins initial password (save this):"
    docker logs jenkins 2>/dev/null | grep -A 5 "Jenkins initial setup" || echo "Check: docker logs jenkins"
    echo ""
    echo "Setup Jenkins:"
    echo "  1. Open http://localhost:8080"
    echo "  2. Unlock Jenkins with password above"
    echo "  3. Install suggested plugins"
    echo "  4. Create credentials for DockerHub and GitHub"
    echo "  5. Create Pipeline job 'AutoDeployX'"
fi

# Start Backend
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "3️⃣  BACKEND (FastAPI)"
echo "════════════════════════════════════════════════════════════════"

cd "$SCRIPT_DIR/autodeploy/app"

# Create venv if doesn't exist
if [ ! -d "venv" ]; then
    print_warning "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
print_status "Installing Python dependencies..."
pip install -q -r requirements.txt

# Start backend in background
print_status "Starting FastAPI backend..."
nohup python main.py > ../../../backend.log 2>&1 &

# Wait for backend
echo "Waiting for backend to start..."
for i in {1..10}; do
    if curl -s http://localhost:8000/health &>/dev/null; then
        print_status "Backend is ready at http://localhost:8000"
        break
    fi
    echo -n "."
    sleep 1
done

# Start Frontend
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "4️⃣  FRONTEND (React)"
echo "════════════════════════════════════════════════════════════════"

cd "$SCRIPT_DIR"

if [ ! -d "node_modules" ]; then
    print_warning "Installing Node dependencies..."
    npm install -q || bun install -q
fi

print_status "Starting frontend development server..."
echo "Frontend will start in a new terminal window..."

# Check if running with bun or npm
if command -v bun &> /dev/null; then
    open -a Terminal "bun run dev"
else
    open -a Terminal "npm run dev"
fi

# Wait a bit for frontend to start
sleep 3

# Summary
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ ALL SERVICES STARTED!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Service URLs:"
echo "  • Dashboard:    http://localhost:5173"
echo "  • Backend API:  http://localhost:8000"
echo "  • Jenkins:      http://localhost:8080"
echo "  • Minikube:     $(minikube ip 2>/dev/null || echo 'Check: minikube ip')"
echo ""
echo "📝 Logs:"
echo "  • Backend: tail -f backend.log"
echo "  • Jenkins: docker logs -f jenkins"
echo "  • Frontend: Check terminal window"
echo ""
echo "🚀 Next steps:"
echo "  1. Open http://localhost:5173"
echo "  2. Configure Jenkins if not done (see SETUP_GUIDE.md)"
echo "  3. Click 'Trigger Pipeline' button"
echo "  4. Watch deployment in real-time!"
echo ""
echo "📖 Full setup guide: cat SETUP_GUIDE.md"
echo ""

# Keep script running
echo "Press Ctrl+C to stop all services"
wait
