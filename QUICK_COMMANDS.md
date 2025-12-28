#!/bin/bash
# AutoDeployX Quick Commands Reference
# Copy & paste commands to run AutoDeployX

# ============================================
# SETUP (Run once)
# ============================================

# Clone and navigate
cd ~/effortless-deploy-hub

# Setup Python backend
cd autodeploy/app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp ../.env.example ../.env
nano ../.env  # Fill in JENKINS_TOKEN and DOCKERHUB_TOKEN

# ============================================
# START SERVICES (4 terminals)
# ============================================

# Terminal 1: Backend API
cd ~/effortless-deploy-hub/autodeploy/app
python main.py
# Runs on http://localhost:8000

# Terminal 2: Frontend Dashboard
cd ~/effortless-deploy-hub
npm run dev  # or: bun run dev
# Runs on http://localhost:5173

# Terminal 3: Jenkins (Docker)
docker run -d --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:latest
# Access on http://localhost:8080

# Terminal 4: Minikube
minikube start --driver=docker
kubectl apply -f ~/effortless-deploy-hub/autodeploy/k8s/deployment.yaml
kubectl apply -f ~/effortless-deploy-hub/autodeploy/k8s/service.yaml

# ============================================
# VERIFY SERVICES RUNNING
# ============================================

# Check backend
curl http://localhost:8000/health
# Should return: {"status": "ok"}

# Check frontend
curl http://localhost:5173

# Check Jenkins
curl http://localhost:8080 | grep -i jenkins

# Check Kubernetes
kubectl get pods
kubectl get deployment

# ============================================
# TEST WORKFLOW
# ============================================

# Test pipeline trigger from command line
curl -X POST http://localhost:8000/pipelines/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "dev",
    "skip_tests": false,
    "skip_security_scan": false,
    "deploy_tag": ""
  }'

# Get pipeline status (replace {ID} with returned ID)
curl http://localhost:8000/pipelines/{ID}

# List all pipelines
curl http://localhost:8000/pipelines/

# ============================================
# JENKINS SETUP (One time in Jenkins UI)
# ============================================

# 1. Open Jenkins
open http://localhost:8080

# 2. Get initial password
docker logs jenkins | grep -A 5 "Jenkins initial setup"

# 3. Install suggested plugins
# (Follow Jenkins prompts)

# 4. Create admin user (optional)

# 5. Get API token
# Profile icon (top right) → Configure → API Token → Add new Token
# Copy token to .env: JENKINS_TOKEN=<token>

# 6. Create credentials
# Manage Jenkins → Manage Credentials → global → Add Credentials
# - DockerHub: username + token, ID = "dockerhub"
# - GitHub: SSH key or PAT, ID = "github"

# 7. Create Pipeline job
# New Item → Name: "AutoDeployX" → Pipeline
# → Definition: Pipeline script from SCM
# → Git → Repository: https://github.com/YOUR/REPO
# → Script Path: autodeploy/jenkins/Jenkinsfile

# ============================================
# MONITORING & DEBUGGING
# ============================================

# Backend logs
tail -f nohup.out

# Backend debug mode
python main.py --log-level DEBUG

# Jenkins logs
docker logs -f jenkins

# Kubernetes pod logs
kubectl logs -f deployment/autodeployx-app

# Kubernetes events
kubectl get events --sort-by='.lastTimestamp'

# Pod details
kubectl describe pod <pod-name>

# Service status
kubectl get svc

# Minikube IP
minikube ip

# Minikube dashboard
minikube dashboard

# ============================================
# DOCKER IMAGE MANAGEMENT
# ============================================

# Build image manually
docker build -t sarika1731/autodeployx:latest \
  -f autodeploy/docker/Dockerfile \
  autodeploy/

# Push to DockerHub
docker tag sarika1731/autodeployx:latest sarika1731/autodeployx:v1.0
docker push sarika1731/autodeployx:latest
docker push sarika1731/autodeployx:v1.0

# List local images
docker images | grep autodeployx

# Pull latest from registry
docker pull sarika1731/autodeployx:latest

# ============================================
# KUBERNETES OPERATIONS
# ============================================

# Scale deployment
kubectl scale deployment autodeployx-app --replicas=5

# Update deployment
kubectl set image deployment/autodeployx-app \
  autodeployx-app=sarika1731/autodeployx:v1.0

# Check rollout status
kubectl rollout status deployment/autodeployx-app

# View rollout history
kubectl rollout history deployment/autodeployx-app

# Rollback to previous version
kubectl rollout undo deployment/autodeployx-app

# Restart pods
kubectl rollout restart deployment/autodeployx-app

# Delete pods (auto-restart)
kubectl delete pod -l app=autodeployx-app

# ============================================
# DATABASE OPERATIONS (Optional)
# ============================================

# Initialize database
cd autodeploy/app
python -c "from models import *; Base.metadata.create_all(engine)"

# View database
sqlite3 autodeployx.db
> SELECT * FROM pipeline_executions;
> SELECT * FROM pipeline_stages;
> .quit

# Reset database
rm autodeploy/app/autodeployx.db

# ============================================
# STOP SERVICES
# ============================================

# Stop backend (in backend terminal)
# Ctrl + C

# Stop frontend (in frontend terminal)
# Ctrl + C

# Stop Jenkins
docker stop jenkins

# Stop Minikube
minikube stop

# ============================================
# CLEAN UP
# ============================================

# Remove Jenkins container
docker rm jenkins

# Remove Jenkins volume
docker volume rm jenkins_home

# Remove Minikube cluster
minikube delete

# Remove Python virtual environment
rm -rf autodeploy/app/venv

# ============================================
# DOCKER COMPOSE (Alternative)
# ============================================

# Start all services
docker-compose up -d

# View services
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v

# ============================================
# API ENDPOINTS REFERENCE
# ============================================

# POST /pipelines/trigger
# Start pipeline deployment
POST http://localhost:8000/pipelines/trigger
{
  "environment": "dev|staging|prod",
  "skip_tests": false,
  "skip_security_scan": false,
  "deploy_tag": ""
}

# GET /pipelines/{pipeline_id}
# Get pipeline status
GET http://localhost:8000/pipelines/abc123

# GET /pipelines/
# List pipelines
GET http://localhost:8000/pipelines/?limit=10

# POST /pipelines/status
# Update pipeline status (from Jenkins)
POST http://localhost:8000/pipelines/status?pipeline_id=abc123&status=running

# POST /pipelines/stage
# Update stage status (from Jenkins)
POST http://localhost:8000/pipelines/stage
{
  "pipeline_id": "abc123",
  "stage_name": "Deploy",
  "status": "success",
  "message": "Deployment complete"
}

# POST /pipelines/log
# Add log entry (from Jenkins)
POST http://localhost:8000/pipelines/log
{
  "pipeline_id": "abc123",
  "level": "info|success|error|warning",
  "message": "Log message",
  "stage": "Deploy"
}

# WS /pipelines/ws
# WebSocket connection for real-time updates
WS http://localhost:8000/pipelines/ws

# ============================================
# USEFUL ALIASES
# ============================================

# Add to ~/.bashrc or ~/.zshrc for quick access

alias ad-backend="cd ~/effortless-deploy-hub/autodeploy/app && python main.py"
alias ad-frontend="cd ~/effortless-deploy-hub && npm run dev"
alias ad-minikube="cd ~/effortless-deploy-hub && minikube start --driver=docker && kubectl apply -f autodeploy/k8s/"
alias ad-logs="docker logs -f jenkins"
alias ad-pods="kubectl get pods"
alias ad-status="curl http://localhost:8000/health && echo && curl http://localhost:8000/pipelines/"
alias ad-stop="docker stop jenkins && minikube stop"
alias ad-reset="docker rm jenkins && docker volume rm jenkins_home && minikube delete"

# ============================================
# EXAMPLE WORKFLOW
# ============================================

# 1. Start services (see above)

# 2. Configure Jenkins
# - Open http://localhost:8080
# - Setup credentials and job

# 3. Trigger pipeline from CLI
curl -X POST http://localhost:8000/pipelines/trigger \
  -H "Content-Type: application/json" \
  -d '{"environment":"dev"}'

# 4. Watch Jenkins
# - Open http://localhost:8080/job/AutoDeployX/
# - See build running

# 5. Watch Dashboard
# - Open http://localhost:5173
# - See real-time updates

# 6. Monitor Kubernetes
# - kubectl get pods
# - kubectl logs -f deployment/autodeployx-app

# 7. View results
# - Dashboard shows all metrics
# - Check pod status: kubectl get pods
# - View image: docker images

# ============================================
# TROUBLESHOOTING COMMANDS
# ============================================

# Check Python version
python3 --version

# Check Docker
docker --version
docker ps

# Check Kubernetes
kubectl cluster-info
kubectl version --client

# Check Minikube
minikube version
minikube status
minikube ip

# Test connectivity
curl -v http://localhost:8000/health
curl -v http://localhost:8080
curl -v http://localhost:5173

# Check open ports
lsof -i :8000   # Backend
lsof -i :5173   # Frontend
lsof -i :8080   # Jenkins

# View environment
cat autodeploy/.env

# Validate Kubernetes manifests
kubectl apply -f autodeploy/k8s/ --dry-run=client

# Test WebSocket
wscat -c ws://localhost:8000/pipelines/ws

# ============================================
# PERFORMANCE TESTING
# ============================================

# Measure pipeline trigger latency
time curl -X POST http://localhost:8000/pipelines/trigger \
  -H "Content-Type: application/json" \
  -d '{"environment":"dev"}'

# Load test with Apache Bench
ab -n 100 -c 10 http://localhost:5173/

# Load test with wrk
wrk -t4 -c100 -d30s http://localhost:8000/pipelines/

# ============================================
# HELPFUL RESOURCES
# ============================================

# Read full setup guide
cat SETUP_GUIDE.md

# Read implementation summary
cat IMPLEMENTATION_SUMMARY.md

# Read README
cat README_AUTODEPLOYX.md

# View Jenkinsfile
cat autodeploy/jenkins/Jenkinsfile

# View K8s deployment
cat autodeploy/k8s/deployment.yaml

# View K8s service
cat autodeploy/k8s/service.yaml

# View API source
cat autodeploy/app/routes/pipelines.py

# View Jenkins integration
cat autodeploy/app/services/jenkins.py

# View Kubernetes integration
cat autodeploy/app/services/kubernetes.py

# ============================================

echo "📚 AutoDeployX Quick Command Reference"
echo "✅ All commands are ready to copy & paste"
echo "📖 Full guide: cat SETUP_GUIDE.md"
echo "🚀 Start deploying!"
