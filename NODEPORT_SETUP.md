# NodePort Service Setup Guide

Your backend service has been configured as NodePort. Here's how to use it.

## What Changed

- **Service Type**: Changed from `ClusterIP` (default) to `NodePort`
- **External Port**: Service is accessible on port `30080` on any node IP
- **Internal Port**: Still accessible on port `8000` within the cluster

## How to Use NodePort

### Step 1: Apply the Updated Service

If you've already deployed with ClusterIP, update it:
```bash
microk8s kubectl apply -f backend-service.yaml
```

Or if deploying fresh:
```bash
# Service will be NodePort from the start
microk8s kubectl apply -f backend-service.yaml
```

### Step 2: Get Your Node IP

```bash
# Get node IP address
microk8s kubectl get nodes -o wide

# Or get service details (shows the NodePort)
microk8s kubectl get service backend
```

You'll see output like:
```
NAME      TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
backend   NodePort   10.152.183.xxx  <none>        8000:30080/TCP   5m
```

The format is: `PORT:NodePort/TCP` (8000:30080/TCP means internal port 8000, external port 30080)

### Step 3: Access the Application

From any machine on your network, access:
```bash
# Replace <NODE_IP> with your actual node IP
curl http://<NODE_IP>:30080

# Example:
curl http://192.168.1.100:30080
```

From the node itself:
```bash
# Access via localhost
curl http://localhost:30080

# Or via node's IP
curl http://<NODE_IP>:30080
```

## NodePort Range

- **Allowed Range**: 30000-32767
- **Current Port**: 30080 (configurable)
- **If not specified**: Kubernetes will assign a random port in the range

## Benefits of NodePort

✅ **No port-forwarding needed** - Service is always accessible  
✅ **Access from any network machine** - Not just localhost  
✅ **Persistent access** - Doesn't require keeping a terminal open  
✅ **Easy testing** - Direct HTTP access  

## Changing the NodePort

### Option 1: Update YAML
Edit `backend-service.yaml`:
```yaml
nodePort: 30081  # Change to any port 30000-32767
```

Then apply:
```bash
microk8s kubectl apply -f backend-service.yaml
```

### Option 2: Use kubectl patch
```bash
microk8s kubectl patch service backend -p '{"spec":{"ports":[{"port":8000,"targetPort":8000,"nodePort":30081}]}}'
```

## Switch Back to ClusterIP

If you want to go back to ClusterIP (internal only):

Edit `backend-service.yaml`:
```yaml
spec:
  type: ClusterIP  # or remove the 'type' line (ClusterIP is default)
  ports:
    - name: "8000"
      port: 8000
      targetPort: 8000
      # Remove nodePort line
```

Apply:
```bash
microk8s kubectl apply -f backend-service.yaml
```

## Multi-Node Setup

With NodePort, the service is accessible on **any node** in the cluster:

```bash
# Access via master node IP
curl http://<MASTER_IP>:30080

# Access via worker node IP
curl http://<WORKER_IP>:30080
```

All nodes will route to the backend pods - Kubernetes handles the load balancing!

## Troubleshooting

### Check Service Type
```bash
microk8s kubectl get service backend -o yaml | grep type
```

Should show: `type: NodePort`

### Check NodePort Port
```bash
microk8s kubectl get service backend
```

Look for the PORT column: `8000:30080/TCP`

### Test Connectivity
```bash
# Test from inside cluster
microk8s kubectl run test --image=curlimages/curl --rm -it -- curl http://backend:8000

# Test NodePort externally (replace with your node IP)
curl -v http://<NODE_IP>:30080
```

### Firewall Issues
If you can't access the port, check firewall:
```bash
# Ubuntu/Debian
sudo ufw allow 30080/tcp

# Or allow all NodePort range
sudo ufw allow 30000:32767/tcp
```

## Example Usage

```bash
# 1. Deploy the service (already NodePort)
microk8s kubectl apply -f backend-service.yaml

# 2. Get node IP
NODE_IP=$(microk8s kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "Node IP: $NODE_IP"

# 3. Test the API
curl http://$NODE_IP:30080

# 4. Check service details
microk8s kubectl describe service backend
```

## Notes

- NodePort is accessible from outside the cluster (no port-forwarding needed)
- Works on single-node and multi-node clusters
- For production, consider using Ingress with LoadBalancer for better routing
- NodePort range 30000-32767 is reserved by Kubernetes

