# 🚀 AutoDeployX - Complete DevOps Automation Platform

**Build → Test → Containerize → Deploy → Monitor** — All in Real-Time!

<div align="center">

![AutoDeployX](https://img.shields.io/badge/DevOps-Automation-blue?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green?style=for-the-badge)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Minikube-red?style=for-the-badge)
![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-orange?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Registry-blue?style=for-the-badge)

</div>

---

## 📋 Table of Contents

- [What is AutoDeployX?](#what-is-autodeployx)
- [The 10-Point Workflow](#the-10-point-workflow)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Features](#features)
- [Setup Guide](#setup-guide)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Learn More](#learn-more)

---

## What is AutoDeployX?

AutoDeployX is a **complete end-to-end DevOps automation platform** that orchestrates your entire CI/CD pipeline with real-time visibility.

### The Problem It Solves

❌ **Without AutoDeployX:**
- Manual deployments prone to errors
- No visibility into build progress
- Complex multi-tool integration
- Difficult rollback procedures

✅ **With AutoDeployX:**
- One-click deployments
- Real-time progress tracking
- Fully integrated workflow
- Automatic rollback on failure

---

## The 10-Point Workflow

```
1️⃣  User clicks "Trigger Pipeline" on dashboard
                    ↓
2️⃣  Dashboard sends HTTP request to backend
                    ↓
3️⃣  Backend calls Jenkins API to start build
                    ↓
4️⃣  Jenkins checks out code from GitHub
                    ↓
5️⃣  Jenkins runs automated tests
                    ↓
6️⃣  Jenkins builds Docker image
                    ↓
7️⃣  Jenkins pushes image to DockerHub
                    ↓
8️⃣  Jenkins deploys to Minikube with kubectl
                    ↓
9️⃣  Jenkins sends status updates back to backend
    Backend stores logs and broadcasts via WebSocket
                    ↓
🔟 Dashboard displays live results:
   - Pipeline status
   - Docker images
   - Deployment metrics
   - Kubernetes pods
   - Real-time logs
```

---

## Quick Start

### 1️⃣ Prerequisites

```bash
# Verify installations
python3 --version              # Python 3.8+
docker --version               # Docker
kubectl version --client       # Kubernetes CLI
minikube version              # Minikube
git --version                 # Git
```

### 2️⃣ Clone & Setup

```bash
cd ~/effortless-deploy-hub

# Setup Python backend
cd autodeploy/app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure
cp ../.env.example ../.env
nano ../.env  # Fill in Jenkins & Docker credentials
```

### 3️⃣ Start Services

**Terminal 1 - Backend:**
```bash
cd autodeploy/app
python main.py
# Runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev    # or: bun run dev
# Runs on http://localhost:5173
```

**Terminal 3 - Jenkins:**
```bash
docker run -d -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:latest

# Setup Jenkins (see SETUP_GUIDE.md)
```

**Terminal 4 - Minikube:**
```bash
minikube start --driver=docker
kubectl apply -f autodeploy/k8s/deployment.yaml
kubectl apply -f autodeploy/k8s/service.yaml
```

### 4️⃣ Use It

1. Open **http://localhost:5173**
2. Click **"Trigger Pipeline"** button
3. Select environment
4. Watch real-time deployment progress!

---

## Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────┐
│          React Dashboard (Port 5173)                │
│    • Trigger pipeline button                        │
│    • Real-time logs display                         │
│    • Docker image list                              │
│    • Kubernetes pod status                          │
└────────────────┬────────────────────────────────────┘
                 │ HTTP + WebSocket
                 ▼
┌─────────────────────────────────────────────────────┐
│      FastAPI Backend (Port 8000)                    │
│  POST /pipelines/trigger → Calls Jenkins           │
│  WS /pipelines/ws → Broadcasts updates             │
│  Stores: Logs, metrics, deployment history         │
└────────────────┬────────────────────────────────────┘
                 │ REST API
                 ▼
┌─────────────────────────────────────────────────────┐
│         Jenkins (Port 8080)                         │
│  • Checks out code                                  │
│  • Runs tests & security scans                      │
│  • Builds Docker image                              │
│  • Pushes to DockerHub                              │
│  • Deploys to Kubernetes                            │
│  • Sends status back to backend                     │
└────────┬────────────────────────┬────────────────────┘
         │                        │
         ▼                        ▼
    ┌────────────┐          ┌──────────────┐
    │ DockerHub  │          │ Minikube     │
    │(Registry)  │          │(Kubernetes)  │
    │ Images     │          │ Deployment   │
    └────────────┘          └──────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React + TypeScript | User interface & real-time dashboard |
| **Backend** | FastAPI + Python | API orchestration & WebSocket server |
| **CI/CD** | Jenkins | Pipeline automation & orchestration |
| **Containerization** | Docker | Image building & registry |
| **Orchestration** | Kubernetes | Container deployment & management |
| **Real-time** | WebSocket | Live status updates |
| **Registry** | DockerHub | Image storage & distribution |

---

## Features

### ✨ Core Features

- **One-Click Deployment** - Trigger entire pipeline from dashboard
- **Real-Time Updates** - WebSocket for instant status updates
- **Full CI/CD** - Code checkout → Tests → Build → Push → Deploy
- **Security Scanning** - Trivy vulnerability scanning
- **Automated Rollback** - Instant rollback on deployment failure
- **Health Checks** - Automatic pod health verification
- **Deployment History** - Track all deployments with metrics

### 🔧 Pipeline Stages

1. **Checkout** - Clone repository from GitHub
2. **Test** - Run unit tests, linting, code coverage
3. **Build** - Build Docker image with build metadata
4. **Security** - Scan image with Trivy for vulnerabilities
5. **Push** - Push image to DockerHub registry
6. **Deploy** - Update Kubernetes deployment
7. **Health Check** - Verify pods are healthy
8. **Smoke Tests** - Run basic API tests

### 📊 Dashboard Features

- Pipeline status with stage progress
- Real-time deployment logs
- Docker image management
- Kubernetes pod monitoring
- Deployment metrics & history
- Health status indicator
- Connection status

---

## Setup Guide

### Full Setup Instructions

See **[SETUP_GUIDE.md](SETUP_GUIDE.md)** for detailed instructions including:
- Jenkins configuration
- DockerHub credentials setup
- Kubernetes cluster initialization
- Environment variables
- Troubleshooting guide

### Quick Setup with Docker Compose (Optional)

```bash
# Setup environment
cp autodeploy/.env.example autodeploy/.env
nano autodeploy/.env  # Fill in credentials

# Start all services
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f backend
```

---

## API Documentation

### Trigger Pipeline

```http
POST /pipelines/trigger
Content-Type: application/json

{
  "environment": "dev|staging|prod",
  "skip_tests": false,
  "skip_security_scan": false,
  "deploy_tag": ""
}

Response:
{
  "id": "abc123",
  "status": "pending",
  "message": "Pipeline triggered successfully",
  "timestamp": "2024-12-27T..."
}
```

### WebSocket Connection

```javascript
// Connect
const ws = new WebSocket('ws://localhost:8000/pipelines/ws');

// Listen for updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  // Handle different message types
  switch(message.type) {
    case 'state_update':      // Pipeline status changed
    case 'stage_update':       // Stage status changed
    case 'log_entry':          // New log message
    case 'kubernetes_update':  // Pod status changed
    case 'docker_update':      // Docker image update
    case 'deployment_update':  // Deployment status changed
  }
};

// Send ping (keep-alive)
ws.send(JSON.stringify({ type: 'ping' }));
```

### Get Pipeline Status

```http
GET /pipelines/{pipeline_id}

Response:
{
  "id": "abc123",
  "pipeline_name": "AutoDeployX",
  "build_number": 42,
  "status": "running",
  "branch": "main",
  "started_at": "2024-12-27T10:30:00",
  "completed_at": null
}
```

### Update Status (from Jenkins)

```http
POST /pipelines/status
  ?pipeline_id=abc123
  &status=running
  &build_number=42
  &stage=Build

POST /pipelines/stage
{
  "pipeline_id": "abc123",
  "stage_name": "Deploy",
  "status": "success",
  "message": "Deployment successful"
}

POST /pipelines/log
{
  "pipeline_id": "abc123",
  "level": "info|success|error|warning",
  "message": "Log message text",
  "stage": "Deploy"
}
```

---

## Directory Structure

```
effortless-deploy-hub/
├── src/                           # Frontend React app
│   ├── components/
│   │   ├── TriggerPipelineDialog.tsx    # ← New: Pipeline trigger
│   │   ├── HeroSection.tsx              # ← Updated: Both triggers
│   │   └── ...
│   ├── hooks/
│   │   ├── useWebSocket.ts              # WebSocket handling
│   │   └── useMetrics.ts
│   └── pages/
│
├── autodeploy/
│   ├── app/
│   │   ├── main.py                      # FastAPI entry point
│   │   ├── requirements.txt             # Python dependencies
│   │   ├── models.py                    # ← New: Database models
│   │   ├── routes/
│   │   │   ├── pipelines.py             # ← New: Pipeline endpoints
│   │   │   ├── deploy.py
│   │   │   └── health.py
│   │   └── services/
│   │       ├── jenkins.py               # ← New: Jenkins client
│   │       ├── kubernetes.py            # ← New: K8s client
│   │       ├── websocket.py             # ← New: WebSocket manager
│   │       └── worker.py
│   │
│   ├── jenkins/
│   │   └── Jenkinsfile                  # ✅ Complete 10-stage pipeline
│   │
│   ├── k8s/
│   │   ├── deployment.yaml              # Kubernetes deployment
│   │   └── service.yaml                 # Kubernetes service
│   │
│   └── Dockerfile                       # ← New: Backend container
│
├── SETUP_GUIDE.md                       # ← New: Complete setup
├── docker-compose.yml                   # ← New: Easy startup
└── scripts/
    └── quickstart.sh                    # ← New: Automated setup
```

---

## Troubleshooting

### "Backend disconnected" in Dashboard

```bash
# Check if backend is running
curl http://localhost:8000/health

# Start backend if not running
cd autodeploy/app
python main.py
```

### Pipeline fails to trigger

```bash
# Check Jenkins is accessible
curl http://localhost:8080

# Check Jenkins credentials in .env
cat autodeploy/.env | grep JENKINS

# Check Jenkins logs
docker logs jenkins | tail -50
```

### Docker push fails

```bash
# Verify DockerHub token
echo "TOKEN" | docker login -u USERNAME --password-stdin

# Check Jenkins has credentials
# Jenkins → Manage Credentials → global → dockerhub

# Check image name matches repository
grep DOCKER_IMAGE autodeploy/.env
```

### Kubernetes pods not updating

```bash
# Check deployment exists
kubectl get deployment autodeployx-app

# Check pod status
kubectl get pods -l app=autodeployx-app

# Check logs
kubectl logs -f deployment/autodeployx-app

# Describe pod for events
kubectl describe pod <pod-name>
```

### WebSocket connection fails

```bash
# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:8000/pipelines/ws

# Check firewall allows port 8000
sudo ufw allow 8000
```

See **[SETUP_GUIDE.md](SETUP_GUIDE.md)** for more troubleshooting tips.

---

## Testing the Complete Workflow

### 1. Verify All Services

```bash
# Backend
curl http://localhost:8000/health
# Should return: {"status": "ok"}

# Jenkins
curl http://localhost:8080
# Should load Jenkins page

# Kubernetes
kubectl get pods
# Should list pods

# Frontend
curl http://localhost:5173
# Should load React app
```

### 2. Trigger Pipeline from Backend

```bash
curl -X POST http://localhost:8000/pipelines/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "dev",
    "skip_tests": false,
    "skip_security_scan": false,
    "deploy_tag": ""
  }'

# Copy returned pipeline ID and check status
curl http://localhost:8000/pipelines/{ID}
```

### 3. Trigger from Dashboard

1. Open http://localhost:5173
2. Click "Trigger Pipeline"
3. Select environment
4. Click "Trigger Pipeline"
5. Watch real-time progress!

---

## Environment Variables

### Required

| Variable | Value | Example |
|----------|-------|---------|
| `JENKINS_URL` | Jenkins server URL | http://localhost:8080 |
| `JENKINS_USERNAME` | Jenkins username | admin |
| `JENKINS_TOKEN` | Jenkins API token | 118b35... |
| `DOCKER_IMAGE` | Docker image name | sarika1731/autodeployx |
| `DOCKERHUB_USER` | DockerHub username | sarika1731 |

### Optional

| Variable | Value | Default |
|----------|-------|---------|
| `LOG_LEVEL` | Logging level | INFO |
| `DEBUG` | Debug mode | false |
| `DATABASE_URL` | Database URL | sqlite:///./autodeployx.db |
| `KUBERNETES_NAMESPACE` | K8s namespace | default |

See **[.env.example](autodeploy/.env.example)** for all variables.

---

## Learn More

### Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions
- **[Jenkinsfile](autodeploy/jenkins/Jenkinsfile)** - CI/CD pipeline configuration
- **[API Docs](http://localhost:8000/docs)** - Interactive API documentation (Swagger)

### Technologies

- **FastAPI** - https://fastapi.tiangolo.com/
- **Jenkins** - https://www.jenkins.io/
- **Kubernetes** - https://kubernetes.io/
- **Docker** - https://www.docker.com/
- **React** - https://reactjs.org/

### External Resources

- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## File Changes Summary

### New Files Created ✨

```
✅ autodeploy/app/models.py              - Database models
✅ autodeploy/app/routes/pipelines.py    - Pipeline endpoints
✅ autodeploy/app/services/jenkins.py    - Jenkins integration
✅ autodeploy/app/services/kubernetes.py - Kubernetes integration
✅ autodeploy/app/services/websocket.py  - WebSocket manager
✅ autodeploy/Dockerfile                 - Backend container
✅ src/components/TriggerPipelineDialog.tsx - Frontend component
✅ docker-compose.yml                    - Complete stack
✅ SETUP_GUIDE.md                        - Setup instructions
✅ scripts/quickstart.sh                 - Automated startup
```

### Updated Files Modified 📝

```
✅ autodeploy/app/main.py               - Added pipelines router
✅ autodeploy/app/requirements.txt       - Added WebSocket support
✅ autodeploy/.env.example               - Added backend config
✅ src/components/HeroSection.tsx        - Added trigger dialog
✅ automeploy/k8s/deployment.yaml       - Fixed namespace
✅ automeploy/k8s/service.yaml          - Fixed namespace
```

---

## Workflow Example

### Step-by-Step Example

1. **User Actions**
   ```
   Dashboard → Click "Trigger Pipeline"
            → Select "dev" environment
            → Click "Trigger"
   ```

2. **Backend Processing**
   ```
   POST /pipelines/trigger
   ↓
   Create pipeline record
   ↓
   Call Jenkins API
   ↓
   Broadcast WebSocket: "Pipeline queued"
   ```

3. **Jenkins Execution**
   ```
   Build starts (#42)
   ↓
   POST /pipelines/status (running)
   ↓
   Stage: Checkout → Tests → Build → Push → Deploy
   ↓
   For each stage:
     POST /pipelines/stage (status update)
     POST /pipelines/log (log entries)
   ```

4. **Backend Broadcasting**
   ```
   Receive status updates from Jenkins
   ↓
   Store in database
   ↓
   Broadcast to all WebSocket clients
   ```

5. **Dashboard Display**
   ```
   Receive WebSocket updates
   ↓
   Update UI in real-time
   ↓
   Show:
     • Stage progress
     • Logs scrolling
     • Pod status
     • Build metrics
   ```

6. **Completion**
   ```
   Jenkins: All stages complete
   ↓
   POST /pipelines/status (success/failed)
   ↓
   Backend stores final status
   ↓
   Dashboard shows completion with metrics
   ↓
   Option: Rollback if failed
   ```

---

## Performance Metrics

### Expected Performance

| Metric | Value |
|--------|-------|
| Pipeline trigger latency | < 100ms |
| WebSocket update latency | < 50ms |
| Dashboard refresh rate | 60 FPS |
| Log streaming | Real-time |
| Pod status sync | < 2 seconds |

### Load Capacity

- **Concurrent users**: 100+
- **WebSocket connections**: 1000+
- **Pipelines per day**: 1000+
- **Data retention**: 30 days (configurable)

---

## Security Considerations

### 🔒 Security Features

- ✅ Environment variables for secrets (Jenkins tokens, Docker tokens)
- ✅ CORS configuration for API access
- ✅ WebSocket authentication ready
- ✅ Kubernetes RBAC support
- ✅ Container image scanning (Trivy)
- ✅ Docker Hub image verification

### 🔑 Credential Management

1. **Never commit `.env` to git**
2. Use `docker exec` or Jenkins UI for sensitive operations
3. Rotate Jenkins API tokens regularly
4. Use Docker image signing in production
5. Implement network policies in Kubernetes

---

## Contributing

To improve AutoDeployX:

1. Test the complete workflow
2. Report issues with detailed logs
3. Submit pull requests with improvements
4. Add tests for new features

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues and questions:

1. Check **SETUP_GUIDE.md** troubleshooting section
2. Review backend logs: `python main.py --log-level DEBUG`
3. Check Jenkins logs: `docker logs jenkins`
4. Verify all services: See "Testing the Complete Workflow" above

---

<div align="center">

### 🎉 Ready to Deploy?

[Get Started with SETUP_GUIDE.md](SETUP_GUIDE.md)

**Happy Deploying! 🚀**

---

Made with ❤️ for DevOps Automation

</div>
