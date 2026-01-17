#!/bin/bash

# MicroK8s Deployment Script
# This script helps deploy the application to MicroK8s cluster

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if MicroK8s is available
check_microk8s() {
    if ! command -v microk8s &> /dev/null; then
        print_error "MicroK8s is not installed or not in PATH"
        exit 1
    fi
    
    if ! microk8s status --wait-ready &> /dev/null; then
        print_error "MicroK8s is not ready"
        exit 1
    fi
    
    print_info "MicroK8s is ready"
}

# Build Docker image
build_image() {
    print_info "Building Docker image..."
    
    if [ ! -f "Dockerfile" ]; then
        print_error "Dockerfile not found"
        exit 1
    fi
    
    docker build -t backend:latest .
    print_info "Docker image built successfully"
}

# Import image to MicroK8s
import_image() {
    print_info "Importing image to MicroK8s..."
    
    docker save backend:latest > backend-image.tar
    microk8s ctr image import backend-image.tar
    rm backend-image.tar
    
    print_info "Image imported successfully"
}

# Deploy database
deploy_database() {
    print_info "Deploying database..."
    
    microk8s kubectl apply -f db-cm0-configmap.yaml
    microk8s kubectl apply -f db-service.yaml
    microk8s kubectl apply -f db-deployment.yaml
    
    print_info "Waiting for database to be ready..."
    microk8s kubectl wait --for=condition=available --timeout=300s deployment/db || {
        print_error "Database deployment failed"
        exit 1
    }
    
    print_info "Database deployed successfully"
}

# Deploy backend
deploy_backend() {
    print_info "Deploying backend..."
    
    microk8s kubectl apply -f backend-cm0-configmap.yaml
    microk8s kubectl apply -f backend-service.yaml
    microk8s kubectl apply -f backend-deployment.yaml
    
    print_info "Waiting for backend to be ready..."
    microk8s kubectl wait --for=condition=available --timeout=300s deployment/backend || {
        print_error "Backend deployment failed"
        exit 1
    }
    
    print_info "Backend deployed successfully"
}

# Show deployment status
show_status() {
    print_info "Deployment Status:"
    echo ""
    microk8s kubectl get pods
    echo ""
    microk8s kubectl get services
    echo ""
    microk8s kubectl get deployments
}

# Main deployment function
deploy_all() {
    check_microk8s
    build_image
    import_image
    deploy_database
    sleep 5  # Give database a moment to initialize
    deploy_backend
    show_status
    
    print_info "Deployment completed successfully!"
    print_info "To access the backend:"
    print_info "  Option 1 (port-forward): microk8s kubectl port-forward service/backend 8000:8000"
    print_info "  Option 2 (NodePort): microk8s kubectl apply -f backend-service-nodeport.yaml (then access via <node-ip>:30080)"
}

# Update backend only
update_backend() {
    print_info "Updating backend..."
    
    check_microk8s
    build_image
    import_image
    
    print_info "Performing rolling update..."
    microk8s kubectl set image deployment/backend auth-ms=backend:latest
    
    print_info "Waiting for rollout to complete..."
    microk8s kubectl rollout status deployment/backend
    
    print_info "Backend updated successfully!"
    show_status
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        deploy_all
        ;;
    update)
        update_backend
        ;;
    status)
        show_status
        ;;
    build)
        build_image
        ;;
    *)
        echo "Usage: $0 {deploy|update|status|build}"
        echo "  deploy  - Full deployment (default)"
        echo "  update  - Update backend only (rolling update)"
        echo "  status  - Show deployment status"
        echo "  build   - Build Docker image only"
        exit 1
        ;;
esac

