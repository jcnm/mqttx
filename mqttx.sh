#!/bin/bash

# MQTTX Sparkplug B Platform - Build, Run, Test Script
# Usage: ./mqttx.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check for required tools
check_native_deps() {
    local missing=0

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js >= 20.0.0"
        missing=1
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 20 ]; then
            print_error "Node.js version must be >= 20.0.0 (current: $(node -v))"
            missing=1
        else
            print_success "Node.js $(node -v) found"
        fi
    fi

    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm@9.15.1
    else
        print_success "pnpm $(pnpm -v) found"
    fi

    return $missing
}

check_docker_deps() {
    local missing=0

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        missing=1
    else
        print_success "Docker found"
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        missing=1
    else
        print_success "Docker Compose found"
    fi

    return $missing
}

# Native commands
cmd_install() {
    print_header "Installing Dependencies"
    check_native_deps || exit 1

    print_info "Running pnpm install..."
    pnpm install

    print_success "Dependencies installed successfully!"
}

cmd_build() {
    print_header "Building Project (Native)"
    check_native_deps || exit 1

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Running install first..."
        pnpm install
    fi

    print_info "Building all packages..."
    pnpm run build

    print_success "Build completed successfully!"
}

cmd_dev() {
    print_header "Starting Development Mode"
    check_native_deps || exit 1

    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Running install first..."
        pnpm install
    fi

    print_info "Starting dev servers (broker + UI)..."
    print_info "Broker will be at: mqtt://localhost:1883, ws://localhost:8083"
    print_info "UI will be at: http://localhost:5173"
    echo ""

    pnpm run dev
}

cmd_broker() {
    print_header "Starting Broker Only"
    check_native_deps || exit 1

    if [ ! -d "node_modules" ]; then
        pnpm install
    fi

    print_info "Starting broker at mqtt://localhost:1883"
    pnpm run broker
}

cmd_ui() {
    print_header "Starting UI Only"
    check_native_deps || exit 1

    if [ ! -d "node_modules" ]; then
        pnpm install
    fi

    print_info "Starting UI at http://localhost:5173"
    pnpm run ui
}

cmd_test() {
    print_header "Running Tests (Native)"
    check_native_deps || exit 1

    if [ ! -d "node_modules" ]; then
        pnpm install
    fi

    print_info "Running tests..."
    pnpm run test

    print_success "Tests completed!"
}

cmd_lint() {
    print_header "Running Linter"
    check_native_deps || exit 1

    if [ ! -d "node_modules" ]; then
        pnpm install
    fi

    print_info "Running lint..."
    pnpm run lint

    print_success "Linting completed!"
}

cmd_clean() {
    print_header "Cleaning Project"

    print_info "Removing build artifacts and node_modules..."
    pnpm run clean 2>/dev/null || true
    rm -rf node_modules
    rm -rf packages/*/node_modules
    rm -rf packages/*/dist

    print_success "Project cleaned!"
}

# Docker commands
cmd_docker_build() {
    print_header "Building Docker Images"
    check_docker_deps || exit 1

    print_info "Building Docker images..."
    docker-compose build

    print_success "Docker images built successfully!"
}

cmd_docker_up() {
    print_header "Starting Docker Containers"
    check_docker_deps || exit 1

    print_info "Starting all services..."
    docker-compose up -d

    echo ""
    print_info "Services:"
    print_info "  - Broker MQTT:     mqtt://localhost:1883"
    print_info "  - Broker WS:       ws://localhost:8083"
    print_info "  - Broker API:      http://localhost:3001"
    print_info "  - UI:              http://localhost:5173"
    print_info "  - Prometheus:      http://localhost:9091"
    print_info "  - Grafana:         http://localhost:3002"
    print_info "  - Redis:           localhost:6379"
    echo ""

    print_success "Docker containers started!"
}

cmd_docker_down() {
    print_header "Stopping Docker Containers"
    check_docker_deps || exit 1

    print_info "Stopping all services..."
    docker-compose down

    print_success "Docker containers stopped!"
}

cmd_docker_logs() {
    print_header "Docker Logs"
    check_docker_deps || exit 1

    docker-compose logs -f
}

cmd_docker_ps() {
    print_header "Docker Container Status"
    check_docker_deps || exit 1

    docker-compose ps
}

cmd_docker_restart() {
    print_header "Restarting Docker Containers"
    check_docker_deps || exit 1

    print_info "Restarting services..."
    docker-compose restart

    print_success "Docker containers restarted!"
}

cmd_docker_clean() {
    print_header "Cleaning Docker Resources"
    check_docker_deps || exit 1

    print_info "Stopping and removing containers, networks, volumes..."
    docker-compose down -v --rmi local

    print_success "Docker resources cleaned!"
}

# Show help
show_help() {
    echo ""
    echo -e "${BLUE}MQTTX Sparkplug B Platform${NC}"
    echo -e "Build, Run, and Test script"
    echo ""
    echo -e "${YELLOW}Usage:${NC} ./mqttx.sh [command]"
    echo ""
    echo -e "${YELLOW}Native Commands:${NC}"
    echo "  install       Install dependencies (pnpm install)"
    echo "  build         Build all packages"
    echo "  dev           Start development mode (broker + UI)"
    echo "  broker        Start broker only"
    echo "  ui            Start UI only"
    echo "  test          Run tests"
    echo "  lint          Run linter"
    echo "  clean         Clean build artifacts and node_modules"
    echo ""
    echo -e "${YELLOW}Docker Commands:${NC}"
    echo "  docker:build  Build Docker images"
    echo "  docker:up     Start all containers"
    echo "  docker:down   Stop all containers"
    echo "  docker:logs   Show container logs"
    echo "  docker:ps     Show container status"
    echo "  docker:restart Restart containers"
    echo "  docker:clean  Remove containers, images, volumes"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./mqttx.sh install       # Install dependencies"
    echo "  ./mqttx.sh build         # Build the project"
    echo "  ./mqttx.sh dev           # Start dev servers"
    echo "  ./mqttx.sh docker:up     # Start with Docker"
    echo ""
}

# Main entry point
case "${1:-help}" in
    install)
        cmd_install
        ;;
    build)
        cmd_build
        ;;
    dev)
        cmd_dev
        ;;
    broker)
        cmd_broker
        ;;
    ui)
        cmd_ui
        ;;
    test)
        cmd_test
        ;;
    lint)
        cmd_lint
        ;;
    clean)
        cmd_clean
        ;;
    docker:build)
        cmd_docker_build
        ;;
    docker:up)
        cmd_docker_up
        ;;
    docker:down)
        cmd_docker_down
        ;;
    docker:logs)
        cmd_docker_logs
        ;;
    docker:ps)
        cmd_docker_ps
        ;;
    docker:restart)
        cmd_docker_restart
        ;;
    docker:clean)
        cmd_docker_clean
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
