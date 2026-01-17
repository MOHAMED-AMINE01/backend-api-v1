# Quick Start Guide - MicroK8s Deployment

## 🚀 Quick Deployment (Single Node)

```bash
# 1. Install MicroK8s (if not installed)
sudo snap install microk8s --classic
sudo usermod -a -G microk8s $USER
newgrp microk8s

# 2. Enable required addons
microk8s enable dns storage

# 3. Deploy using script
./deploy.sh deploy

# OR manually:
docker build -t backend:latest .
docker save backend:latest > backend-image.tar
microk8s ctr image import backend-image.tar
rm backend-image.tar

microk8s kubectl apply -f db-cm0-configmap.yaml
microk8s kubectl apply -f db-service.yaml
microk8s kubectl apply -f db-deployment.yaml
microk8s kubectl wait --for=condition=available --timeout=300s deployment/db

microk8s kubectl apply -f backend-cm0-configmap.yaml
microk8s kubectl apply -f backend-service.yaml
microk8s kubectl apply -f backend-deployment.yaml
microk8s kubectl wait --for=condition=available --timeout=300s deployment/backend

# 4. Access the application
# Your service is configured as NodePort - accessible on port 30080
# Get node IP: microk8s kubectl get nodes -o wide
# Access via: http://<node-ip>:30080
# Or from node: curl http://localhost:30080

# Alternative: Port forwarding (if you prefer)
# microk8s kubectl port-forward service/backend 8000:8000
# Then access: http://localhost:8000
```

## 🔄 Rolling Update (Backend)

```bash
# Option 1: Using script
./deploy.sh update

# Option 2: Manual update
docker build -t backend:latest .
docker save backend:latest > backend-image.tar
microk8s ctr image import backend-image.tar
rm backend-image.tar

microk8s kubectl set image deployment/backend auth-ms=backend:latest
microk8s kubectl rollout status deployment/backend
```

## 📊 Check Status

```bash
# Using script
./deploy.sh status

# Manual commands
microk8s kubectl get pods
microk8s kubectl get services
microk8s kubectl get deployments
microk8s kubectl get nodes  # For multi-node
```

## 🖥️ Multi-Node Setup

### On Master Node:
```bash
# Generate join token
microk8s add-node
# Save the output command
```

### On Worker Node:
```bash
# Install MicroK8s
sudo snap install microk8s --classic
sudo usermod -a -G microk8s $USER
newgrp microk8s

# Join cluster (use command from master)
microk8s join <MASTER_IP>:25000/<TOKEN>/<TOKEN>

# Load images (copy from master or build locally)
docker build -t backend:latest .
docker save backend:latest > backend-image.tar
microk8s ctr image import backend-image.tar
```

### Verify Multi-Node:
```bash
# On master node
microk8s kubectl get nodes
```

## 🛠️ Useful Commands

```bash
# View logs
microk8s kubectl logs -f deployment/backend
microk8s kubectl logs -f deployment/db

# Describe resources
microk8s kubectl describe deployment backend
microk8s kubectl describe pod <pod-name>

# Scale deployment
microk8s kubectl scale deployment/backend --replicas=3

# Rollback update
microk8s kubectl rollout undo deployment/backend

# View rollout history
microk8s kubectl rollout history deployment/backend

# Delete deployment
microk8s kubectl delete -f backend-deployment.yaml
microk8s kubectl delete -f backend-service.yaml
```

## 🌐 Accessing the Application

Your backend service is configured as **NodePort** - accessible on port 30080.

### NodePort (Current Setup - No Port-Forwarding Needed)
```bash
# Get node IP
microk8s kubectl get nodes -o wide

# Access via node IP (e.g., http://192.168.1.100:30080)
curl http://<node-ip>:30080

# Or from the node itself
curl http://localhost:30080

# Check service details
microk8s kubectl get service backend
```

### Alternative: Port Forwarding (If Needed)
```bash
microk8s kubectl port-forward service/backend 8000:8000
# Access: http://localhost:8000
```
**Note:** Port-forwarding keeps terminal active. Press Ctrl+C to stop.

### From Inside Cluster
```bash
# Service is accessible as http://backend:8000 from any pod
microk8s kubectl run test --image=curlimages/curl --rm -it -- curl http://backend:8000
```

## 📝 Notes

- **Port-forwarding is NOT required** - it's just the easiest way for local testing
- For production, use a container registry instead of local image imports
- Database uses ConfigMap for init.sql (consider PersistentVolumes for data)
- Rolling update strategy is configured (maxSurge: 1, maxUnavailable: 0)
- Backend service exposes port 8000 (ClusterIP by default)
- Database service exposes port 5432

