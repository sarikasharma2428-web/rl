# AutoDeployX Backend Setup Guide

Complete instructions to set up and run the AutoDeployX CI/CD platform.

## 🎯 What is AutoDeployX?

AutoDeployX is an end-to-end DevOps automation platform that:

```
Dashboard → Backend → Jenkins → Docker Build → DockerHub → Kubernetes
    ↑                    ↓
    └──── WebSocket (Real-time updates) ────┘
```

**The 10-Point Workflow:**

1. 👤 **User** clicks "Trigger Pipeline" on dashboard
2. 📡 **Dashboard** sends POST request to backend
3. 🔨 **Backend** calls Jenkins API to start build
4. 📥 **Jenkins** checks out code from GitHub
5. 🧪 **Jenkins** runs automated tests
6. 🐳 **Jenkins** builds Docker image
7. 📤 **Jenkins** pushes image to DockerHub
8. ⚙️ **Jenkins** deploys to Minikube with kubectl
9. 📊 **Jenkins** sends status + logs back to backend via webhooks
10. 🔄 **Backend** broadcasts live updates to dashboard via WebSocket

---

## ⚙️ Prerequisites

### Required Software

```bash
# Check installations
python3 --version          # Python 3.8+
docker --version           # Docker (for Jenkins container)
kubectl version --client   # Kubernetes CLI
minikube version          # Minikube
git --version             # Git
```

### Required Accounts

- **GitHub**: Repository access
- **DockerHub**: For image registry (free account at https://hub.docker.com)
- **Jenkins**: Running locally or remotely

---

## 📦 Installation

### 1. Clone Repository

```bash
cd ~/effortless-deploy-hub
```

### 2. Setup Python Virtual Environment

```bash
cd autodeploy/app
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
# Copy example file
cp ../.env.example ../.env

# Edit with your settings
nano ../.env
```

**Required settings to fill:**

| Setting | Value | Where to Get |
|---------|-------|-------------|
| `JENKINS_URL` | http://localhost:8080 | Jenkins server |
| `JENKINS_USERNAME` | admin | Jenkins login |
| `JENKINS_TOKEN` | * | Jenkins → Your Name → Configure → API Token |
| `DOCKERHUB_USER` | your_username | DockerHub profile |
| `DOCKERHUB_TOKEN` | * | hub.docker.com → Account → Security → New Token |

---

## 🚀 Starting the Services

### Step 1: Start Jenkins (Docker)

```bash
# Pull and run Jenkins
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:latest

# Check logs for initial password
docker logs jenkins | grep -A 5 "Jenkins initial setup is required"

# Open Jenkins
open http://localhost:8080
```

**Initial Jenkins Setup:**
1. Unlock Jenkins with the password from logs
2. Install suggested plugins
3. Create admin user (or skip)
4. Create Jenkins API Token:
   - Click your username (top right)
   - Configure
   - API Token → Add new Token
   - Copy token to `.env` file

### Step 2: Create Jenkins Credentials

In Jenkins UI:

1. Go to **Manage Jenkins** → **Manage Credentials**
2. Click **global** domain
3. Click **Add Credentials**

**Add DockerHub credentials:**
- Kind: Username with password
- Username: `sarika1731` (your DockerHub username)
- Password: Your DockerHub token (from hub.docker.com)
- ID: `dockerhub` (important!)

**Add GitHub credentials (if needed):**
- Kind: SSH Key or Username with token
- ID: `github`

### Step 3: Create Jenkins Pipeline Job

In Jenkins UI:

1. Click **New Item**
2. Name: `AutoDeployX`
3. Type: **Pipeline**
4. In Pipeline section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/YOUR_USERNAME/effortless-deploy-hub.git`
   - Script Path: `autodeploy/jenkins/Jenkinsfile`
5. Save and test

### Step 4: Setup Minikube

```bash
# Start Minikube
minikube start --driver=docker

# Verify cluster
kubectl cluster-info
kubectl get nodes

# Setup namespaces (optional)
kubectl create namespace default

# View dashboard (optional)
minikube dashboard
```

### Step 5: Create Kubernetes Deployment

```bash
# Apply Minikube configs
kubectl apply -f autodeploy/k8s/deployment.yaml
kubectl apply -f autodeploy/k8s/service.yaml

# Check deployment
kubectl get deployments
kubectl get pods
kubectl get svc
```

---

## 🏃 Running the Backend

### Start the Server

```bash
cd autodeploy/app

# Activate venv
source venv/bin/activate

# Run FastAPI server
python main.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
🚀 AutoDeployX started successfully!
```

### Test Backend

```bash
# Health check
curl http://localhost:8000/health

# List pipelines
curl http://localhost:8000/pipelines/

# Trigger pipeline
curl -X POST http://localhost:8000/pipelines/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "dev",
    "skip_tests": false,
    "skip_security_scan": false,
    "deploy_tag": ""
  }'
```

---

## 🖥️ Running the Frontend

### In another terminal:

```bash
cd ~/effortless-deploy-hub

# Install dependencies (one time)
npm install

# or with bun
bun install

# Start dev server
npm run dev
# or
bun run dev
```

Open http://localhost:5173 (or the URL shown in terminal)

---

## 🔌 API Endpoints

### Pipelines

```http
# Trigger pipeline
POST /pipelines/trigger
Content-Type: application/json

{
  "environment": "dev|staging|prod",
  "skip_tests": false,
  "skip_security_scan": false,
  "deploy_tag": ""
}

# List pipelines
GET /pipelines/?limit=10

# Get pipeline status
GET /pipelines/{pipeline_id}

# Update pipeline status (called by Jenkins)
POST /pipelines/status?pipeline_id=xxx&status=running

# Update stage (called by Jenkins)
POST /pipelines/stage
Content-Type: application/json

{
  "pipeline_id": "xxx",
  "stage_name": "Checkout",
  "status": "success",
  "message": "Checked out main branch"
}

# Add log entry (called by Jenkins)
POST /pipelines/log
Content-Type: application/json

{
  "pipeline_id": "xxx",
  "level": "info|success|error|warning",
  "message": "Log message",
  "stage": "Checkout"
}
```

### WebSocket

```javascript
// Connect from frontend
const ws = new WebSocket('ws://localhost:8000/pipelines/ws');

// Listen for updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message.type); // 'pipeline_update', 'stage_update', 'log_entry', etc.
  console.log(message.data);
};

// Send ping (keep-alive)
ws.send(JSON.stringify({ type: 'ping' }));
```

---

## 📊 Environment Variables Reference

```env
# Backend
BACKEND_URL=http://localhost:8000
WS_URL=ws://localhost:8000/ws

# Jenkins (REQUIRED)
JENKINS_URL=http://localhost:8080
JENKINS_USERNAME=admin
JENKINS_TOKEN=your_token_here
JENKINS_PIPELINE=AutoDeployX

# Docker (REQUIRED)
DOCKER_IMAGE=sarika1731/autodeployx
DOCKERHUB_USER=sarika1731
DOCKERHUB_TOKEN=your_token_here

# Kubernetes
KUBERNETES_NAMESPACE=default
KUBERNETES_DEPLOYMENT=autodeployx-app

# Database (optional)
DATABASE_URL=sqlite:///./autodeployx.db

# App
LOG_LEVEL=INFO
DEBUG=false
```

---

## 🧪 Testing the Complete Workflow

### 1. Check all services are running

```bash
# Backend
curl http://localhost:8000/health
# Should return: {"status": "ok"}

# Jenkins
curl http://localhost:8080
# Should return Jenkins page

# Kubernetes
kubectl get pods
# Should list pods

# Frontend
curl http://localhost:5173
# Should load dashboard
```

### 2. Trigger a pipeline from backend

```bash
curl -X POST http://localhost:8000/pipelines/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "dev",
    "skip_tests": false,
    "skip_security_scan": false,
    "deploy_tag": ""
  }'
```

Copy the returned `id` and check status:

```bash
curl http://localhost:8000/pipelines/{id}
```

### 3. Watch in Jenkins UI

Go to http://localhost:8080/job/AutoDeployX/

You should see a new build running.

### 4. Watch in Frontend Dashboard

Open http://localhost:5173

Click "Trigger Pipeline" button and select environment. You should see:
- ✅ Real-time stage progress
- 📝 Live logs streaming
- 🐳 Docker image details
- ⚙️ Kubernetes pod status

---

## 🐛 Troubleshooting

### "Backend disconnected" in Dashboard

```bash
# Check backend is running
ps aux | grep "python main.py"

# Check port 8000 is listening
lsof -i :8000

# Start backend
cd autodeploy/app
python main.py
```

### WebSocket connection failed

```bash
# Check backend WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:8000/pipelines/ws

# Check firewall
sudo ufw allow 8000
```

### Jenkins cannot connect to backend

```bash
# From Jenkins container, test connectivity
docker exec jenkins bash -c "curl http://host.docker.internal:8000/health"

# Or use Jenkins container network
docker network ls
docker inspect <network> | grep Gateway
```

### Kubernetes deployment not updating

```bash
# Check deployment status
kubectl describe deployment autodeployx-app

# Check pod logs
kubectl logs -f <pod-name>

# Verify image pull
kubectl get events | grep autodeployx

# Check image exists locally
docker images | grep autodeployx
```

### DockerHub push fails

```bash
# Verify DockerHub credentials in Jenkins
# Jenkins → Manage Credentials → global → dockerhub

# Test login
echo "YOUR_TOKEN" | docker login -u sarika1731 --password-stdin

# Check image name matches exactly
docker images | grep autodeployx
```

---

## 📈 Monitoring and Logs

### Backend logs

```bash
# Real-time logs
tail -f nohup.out

# Or with Python logging
python main.py --log-level DEBUG
```

### Jenkins logs

```bash
docker logs -f jenkins
```

### Kubernetes logs

```bash
# Pod logs
kubectl logs -f deployment/autodeployx-app

# Events
kubectl get events --sort-by='.lastTimestamp'

# Pod details
kubectl describe pod <pod-name>
```

### Docker logs

```bash
docker logs <container-id>
```

---

## 📝 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Dashboard)                      │
│              http://localhost:5173                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI)                          │
│              http://localhost:8000                          │
│  • POST /pipelines/trigger → Jenkins                        │
│  • WebSocket /pipelines/ws → Live updates                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP (REST API)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  JENKINS (CI/CD)                            │
│              http://localhost:8080                          │
│  • Stages: Checkout, Test, Build, Push, Deploy            │
│  • Calls back to Backend with status                       │
└────────────────────────┬────────────────────────────────────┘
              ┌──────────┴──────────────────┐
              │                             │
              ▼                             ▼
    ┌──────────────────┐         ┌──────────────────┐
    │   DOCKERHUB      │         │  KUBERNETES      │
    │  (Image Store)   │         │  (Minikube)      │
    │ sarika1731/...   │         │ kubectl apply    │
    └──────────────────┘         └──────────────────┘
```

---

## 🎓 Learning Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **Jenkins**: https://www.jenkins.io/doc/
- **Kubernetes**: https://kubernetes.io/docs/
- **Docker**: https://docs.docker.com/
- **WebSockets**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

## 📞 Support

If you encounter issues:

1. Check **Troubleshooting** section above
2. Review backend logs: `python main.py`
3. Check Jenkins logs: `docker logs jenkins`
4. Verify all services running: `curl http://localhost:8000/health`
5. Test endpoints with `curl` commands provided

---

**🎉 You're all set! Happy deploying!**
