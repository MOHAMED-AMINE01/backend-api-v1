# MicroK8s Deployment Guide

Complete step-by-step guide for deploying your backend API to MicroK8s cluster (single node and multi-node setup).

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup on Master Node](#initial-setup-on-master-node)
3. [Building and Loading Docker Image](#building-and-loading-docker-image)
4. [Deploying to Master Node](#deploying-to-master-node)
5. [Adding Worker Nodes](#adding-worker-nodes)
6. [Updating Backend (Rolling Update)](#updating-backend-rolling-update)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### On Master Node:
```bash
# Install MicroK8s
sudo snap install microk8s --classic

# Add your user to the microk8s group
sudo usermod -a -G microk8s $USER
sudo chown -f -R $USER ~/.kube
newgrp microk8s

# Enable required addons
microk8s enable dns storage ingress

# Install kubectl (optional, microk8s.kubectl also works)
sudo snap install kubectl --classic

# Install Docker (if not already installed)
sudo apt-get update
sudo apt-get install docker.io -y
sudo usermod -a -G docker $USER
newgrp docker
```

---

## Initial Setup on Master Node

### Step 1: Verify MicroK8s Status
```bash
# Check MicroK8s status
microk8s status --wait-ready

# Verify nodes
microk8s kubectl get nodes
```

### Step 2: Get Join Token (for multi-node setup)
```bash
# Generate join token (save this for worker nodes)
microk8s add-node
```

**Save the output** - you'll need this command on worker nodes. Example output:
```
Join node with: microk8s join 192.168.1.100:25000/xxxxxxxxxxxxx/xxxxxxxxxxxxx
```

---

## Building and Loading Docker Image

### Option A: Using Local Registry (Recommended for Single Node)

#### Step 1: Build the Docker Image
```bash
# Navigate to your project directory
cd /Users/mohammedlahmer/Education/Practice/ms_cloud/backend-api-v1

# Build the Docker image
docker build -t backend:latest .
```

#### Step 2: Import Image into MicroK8s
```bash
# Export the image
docker save backend:latest > backend-image.tar

# Import into MicroK8s
microk8s ctr image import backend-image.tar

# Verify image is loaded
microk8s ctr images list | grep backend
```

### Option B: Using Private Registry (Recommended for Multi-Node)

#### Step 1: Build and Tag Image
```bash
# Build the image
docker build -t backend:latest .

# Tag for your registry (replace with your registry URL)
docker tag backend:latest localhost:32000/backend:latest

# Or if using external registry
docker tag backend:latest your-registry.com/backend:latest
```

#### Step 2: Enable MicroK8s Registry (if using local registry)
```bash
# Enable local registry
microk8s enable registry

# Push to local registry
docker push localhost:32000/backend:latest

# On each node, configure insecure registry (if needed)
# Edit /etc/docker/daemon.json:
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "insecure-registries": ["localhost:32000"]
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

#### Step 3: Update Deployment YAML (if using registry)
Update `backend-deployment.yaml`:
```yaml
image: localhost:32000/backend:latest
# or
image: your-registry.com/backend:latest
```

---

## Deploying to Master Node

### Step 1: Update ConfigMap with Init SQL
Ensure `init.sql` is in the ConfigMap. The generated YAML should already have it, but verify:
```bash
# Check the db-cm0-configmap.yaml contains your init.sql
cat db-cm0-configmap.yaml
```

### Step 2: Deploy Database First
```bash
# Deploy database ConfigMap
microk8s kubectl apply -f db-cm0-configmap.yaml

# Deploy database Service
microk8s kubectl apply -f db-service.yaml

# Deploy database Deployment
microk8s kubectl apply -f db-deployment.yaml

# Wait for database to be ready
microk8s kubectl wait --for=condition=available --timeout=300s deployment/db
```

### Step 3: Deploy Backend
```bash
# Deploy backend ConfigMap
microk8s kubectl apply -f backend-cm0-configmap.yaml

# Deploy backend Service
microk8s kubectl apply -f backend-service.yaml

# Deploy backend Deployment
microk8s kubectl apply -f backend-deployment.yaml

# Wait for backend to be ready
microk8s kubectl wait --for=condition=available --timeout=300s deployment/backend
```

### Step 4: Verify Deployment
```bash
# Check all pods are running
microk8s kubectl get pods

# Check services
microk8s kubectl get services

# Check deployment status
microk8s kubectl get deployments

# View backend logs
microk8s kubectl logs -f deployment/backend

# View database logs
microk8s kubectl logs -f deployment/db
```

### Step 5: Test the Application

**Port-forwarding is NOT necessary**, but it's the easiest way for local testing. Here are your options:

#### Option 1: Port Forwarding (Easiest for Local Testing)
```bash
# Port forward to access the backend (in a new terminal)
microk8s kubectl port-forward service/backend 8000:8000

# In another terminal, test the API
curl http://localhost:8000
```
**Note:** This keeps the terminal active. Press Ctrl+C to stop.

#### Option 2: NodePort Service (Access from Any Node IP)
Create a NodePort service or update existing service:
```bash
# Create a NodePort service (alternative file)
cat > backend-service-nodeport.yaml <<EOF
apiVersion: v1
kind: Service
metadata:
  name: backend-nodeport
spec:
  type: NodePort
  ports:
    - port: 8000
      targetPort: 8000
      nodePort: 30080  # Range: 30000-32767
  selector:
    io.kompose.service: backend
EOF

microk8s kubectl apply -f backend-service-nodeport.yaml

# Get node IP
microk8s kubectl get nodes -o wide

# Access via node IP (e.g., if node IP is 192.168.1.100)
curl http://192.168.1.100:30080
```

#### Option 3: Access from Within Cluster
```bash
# Exec into a pod and test from inside the cluster
microk8s kubectl run curl-test --image=curlimages/curl -it --rm -- sh
# Then inside the pod:
curl http://backend:8000
```

#### Option 4: Using Ingress (For Production)
```bash
# Enable ingress
microk8s enable ingress

# Create ingress resource
cat > backend-ingress.yaml <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: backend-ingress
spec:
  rules:
    - host: backend.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 8000
EOF

microk8s kubectl apply -f backend-ingress.yaml

# Access via ingress (may need to add backend.local to /etc/hosts)
curl http://backend.local
```

**Recommendation:** Use **port-forwarding** for quick local testing. For production, use **NodePort** or **Ingress**.

---

## Adding Worker Nodes

### On Each Worker Node:

#### Step 1: Install MicroK8s
```bash
# Install MicroK8s
sudo snap install microk8s --classic

# Add user to microk8s group
sudo usermod -a -G microk8s $USER
sudo chown -f -R $USER ~/.kube
newgrp microk8s
```

#### Step 2: Join the Cluster
Use the join command from the master node:
```bash
# Use the command from master node's "microk8s add-node" output
microk8s join <MASTER_IP>:25000/<TOKEN>/<TOKEN>

# Example:
# microk8s join 192.168.1.100:25000/xxxxxxxxxxxxx/xxxxxxxxxxxxx
```

#### Step 3: Install Docker and Load Images (if using local images)
```bash
# Install Docker
sudo apt-get update
sudo apt-get install docker.io -y
sudo usermod -a -G docker $USER
newgrp docker

# Copy and import the backend image
# Option 1: Copy image file from master
scp user@master:/path/to/backend-image.tar .
microk8s ctr image import backend-image.tar

# Option 2: Build image on worker node (if you have source code)
cd /path/to/backend-api-v1
docker build -t backend:latest .
docker save backend:latest > backend-image.tar
microk8s ctr image import backend-image.tar
```

#### Step 4: Verify Node Joined
On the master node, verify the worker node:
```bash
microk8s kubectl get nodes
```

You should see both master and worker nodes in the list.

---

## Updating Backend (Rolling Update)

### Method 1: Using kubectl set image (Recommended)

#### Step 1: Build New Image
```bash
# Build new version
docker build -t backend:v1.1.0 .

# Or update latest
docker build -t backend:latest .
```

#### Step 2: Load/Import Image
```bash
# For single node
docker save backend:latest > backend-image.tar
microk8s ctr image import backend-image.tar

# For multi-node: Push to registry or load on each node
docker tag backend:latest localhost:32000/backend:latest
docker push localhost:32000/backend:latest
```

#### Step 3: Perform Rolling Update
```bash
# Update the deployment image
microk8s kubectl set image deployment/backend auth-ms=backend:latest

# Or with specific version
microk8s kubectl set image deployment/backend auth-ms=backend:v1.1.0

# Monitor the rolling update
microk8s kubectl rollout status deployment/backend

# Watch pods during update
microk8s kubectl get pods -w
```

#### Step 4: Verify Update
```bash
# Check deployment status
microk8s kubectl get deployment backend

# Check pod images
microk8s kubectl describe deployment backend | grep Image

# Test the application
microk8s kubectl port-forward service/backend 8000:8000
curl http://localhost:8000
```

### Method 2: Using kubectl apply (Update YAML)

#### Step 1: Update Deployment YAML
Edit `backend-deployment.yaml`:
```yaml
image: backend:v1.1.0  # or backend:latest
```

#### Step 2: Apply Updated YAML
```bash
# Apply the updated deployment
microk8s kubectl apply -f backend-deployment.yaml

# Monitor rollout
microk8s kubectl rollout status deployment/backend
```

### Method 3: Rolling Restart (if only config changed)
```bash
# Rolling restart (useful for config changes)
microk8s kubectl rollout restart deployment/backend

# Monitor status
microk8s kubectl rollout status deployment/backend
```

### Rollback (if update fails)

```bash
# View rollout history
microk8s kubectl rollout history deployment/backend

# Rollback to previous version
microk8s kubectl rollout undo deployment/backend

# Rollback to specific revision
microk8s kubectl rollout undo deployment/backend --to-revision=2
```

---

## Scaling the Deployment

### Scale Up/Down
```bash
# Scale backend to 3 replicas
microk8s kubectl scale deployment/backend --replicas=3

# Scale database (use with caution - ensure persistence)
microk8s kubectl scale deployment/db --replicas=1

# Check scaling status
microk8s kubectl get pods
```

---

## Troubleshooting

### Check Pod Status
```bash
# Get all pods
microk8s kubectl get pods

# Describe a pod for detailed info
microk8s kubectl describe pod <pod-name>

# View pod logs
microk8s kubectl logs <pod-name>
microk8s kubectl logs -f <pod-name>  # follow logs
```

### Check Services
```bash
# Get services
microk8s kubectl get services

# Describe service
microk8s kubectl describe service backend
```

### Debug Image Issues
```bash
# List images in MicroK8s
microk8s ctr images list

# Remove and re-import image
microk8s ctr images rm docker.io/library/backend:latest
docker save backend:latest > backend-image.tar
microk8s ctr image import backend-image.tar
```

### Check Events
```bash
# View cluster events
microk8s kubectl get events --sort-by='.lastTimestamp'

# View events for specific resource
microk8s kubectl describe deployment backend
```

### Network Issues (Multi-Node)
```bash
# Check node connectivity
microk8s kubectl get nodes -o wide

# Ping between nodes to verify network
ping <node-ip>

# Check if services are accessible
microk8s kubectl exec -it <pod-name> -- nslookup db
microk8s kubectl exec -it <pod-name> -- nslookup backend
```

### Reset MicroK8s (Last Resort)
```bash
# WARNING: This will delete all deployments
microk8s reset

# Re-enable addons
microk8s enable dns storage ingress
```

---

## Accessing Your Application

### Quick Access Options:

1. **Port Forwarding** (Simplest - recommended for testing):
   ```bash
   microk8s kubectl port-forward service/backend 8000:8000
   # Access at: http://localhost:8000
   ```

2. **NodePort** (Access via node IP):
   ```bash
   # Change service type to NodePort or create NodePort service
   # Access at: http://<node-ip>:30080
   ```

3. **Access from inside cluster**:
   ```bash
   # Service is accessible as: http://backend:8000
   microk8s kubectl run test --image=curlimages/curl --rm -it -- curl http://backend:8000
   ```

**For testing:** Port-forwarding is the easiest option (not required, but convenient).

---

## Quick Reference Commands

```bash
# Check cluster status
microk8s status

# Get all resources
microk8s kubectl get all

# Access Kubernetes dashboard (if enabled)
microk8s enable dashboard
microk8s kubectl port-forward -n kube-system service/kubernetes-dashboard 10443:443

# Enable ingress (if not already enabled)
microk8s enable ingress

# Enable metrics (for monitoring)
microk8s enable metrics-server

# View configuration
microk8s kubectl config view
```

---

## Notes

1. **Image Strategy**: For production, use a proper container registry (Docker Hub, Harbor, etc.) instead of local image imports.

2. **Database Persistence**: The current setup uses ConfigMap for init.sql. For production, consider using PersistentVolumes for database data.

3. **Secrets**: Store sensitive data (passwords, tokens) in Kubernetes Secrets, not in ConfigMaps or environment variables.

4. **Resource Limits**: Add resource requests and limits to deployments for production.

5. **Health Checks**: Add liveness and readiness probes to your deployments.

6. **Backup**: Regularly backup your database data.

7. **Monitoring**: Enable monitoring addons and set up logging aggregation.

