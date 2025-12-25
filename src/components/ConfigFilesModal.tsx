import { useState } from "react";
import { X, Copy, Check, FileCode, Download } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConfigFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

const configFiles: ConfigFile[] = [
  {
    name: "Dockerfile",
    path: "Dockerfile",
    language: "dockerfile",
    content: `# Multi-stage build for Python application
FROM python:3.11-slim as builder

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`,
  },
  {
    name: "Jenkinsfile",
    path: "Jenkinsfile",
    language: "groovy",
    content: `pipeline {
    agent any
    
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        IMAGE_NAME = 'yourusername/autodeployx'
        IMAGE_TAG = "\${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                script {
                    sh 'docker build -t \${IMAGE_NAME}:\${IMAGE_TAG} .'
                    sh 'docker tag \${IMAGE_NAME}:\${IMAGE_TAG} \${IMAGE_NAME}:latest'
                }
            }
        }
        
        stage('Test') {
            steps {
                sh 'docker run --rm \${IMAGE_NAME}:\${IMAGE_TAG} pytest tests/ -v'
            }
        }
        
        stage('Push to DockerHub') {
            steps {
                script {
                    sh 'echo \$DOCKERHUB_CREDENTIALS_PSW | docker login -u \$DOCKERHUB_CREDENTIALS_USR --password-stdin'
                    sh 'docker push \${IMAGE_NAME}:\${IMAGE_TAG}'
                    sh 'docker push \${IMAGE_NAME}:latest'
                }
            }
        }
        
        stage('Deploy to Minikube') {
            steps {
                script {
                    sh 'kubectl set image deployment/autodeployx autodeployx=\${IMAGE_NAME}:\${IMAGE_TAG} --record'
                    sh 'kubectl rollout status deployment/autodeployx'
                }
            }
        }
    }
    
    post {
        always {
            sh 'docker logout'
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}`,
  },
  {
    name: "docker-compose.yml",
    path: "docker-compose.yml",
    language: "yaml",
    content: `version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/autodeployx
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    networks:
      - autodeployx-network
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=autodeployx
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - autodeployx-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - autodeployx-network
    restart: unless-stopped

  jenkins:
    image: jenkins/jenkins:lts
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - autodeployx-network
    restart: unless-stopped

networks:
  autodeployx-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  jenkins_home:`,
  },
  {
    name: "deployment.yaml",
    path: "k8s/deployment.yaml",
    language: "yaml",
    content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: autodeployx
  labels:
    app: autodeployx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: autodeployx
  template:
    metadata:
      labels:
        app: autodeployx
    spec:
      containers:
      - name: autodeployx
        image: yourusername/autodeployx:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: autodeployx-secrets
              key: database-url
---
apiVersion: v1
kind: Service
metadata:
  name: autodeployx-service
spec:
  selector:
    app: autodeployx
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer`,
  },
  {
    name: "health-check.sh",
    path: "scripts/health-check.sh",
    language: "bash",
    content: `#!/bin/bash

# Health Check Script for AutoDeployX
# Run this script to check the health of all services

set -e

echo "🔍 AutoDeployX Health Check"
echo "=========================="

# Colors
GREEN='\\033[0;32m'
RED='\\033[0;31m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

check_service() {
    local service=$1
    local url=$2
    
    if curl -s --max-time 5 "$url" > /dev/null; then
        echo -e "[\${GREEN}✓\${NC}] $service is healthy"
        return 0
    else
        echo -e "[\${RED}✗\${NC}] $service is not responding"
        return 1
    fi
}

# Check Minikube
echo ""
echo "📦 Checking Minikube..."
if minikube status | grep -q "Running"; then
    echo -e "[\${GREEN}✓\${NC}] Minikube is running"
else
    echo -e "[\${RED}✗\${NC}] Minikube is not running"
    echo "Run: minikube start"
fi

# Check Kubernetes pods
echo ""
echo "🐳 Checking Kubernetes Pods..."
kubectl get pods -l app=autodeployx --no-headers | while read line; do
    pod_name=$(echo $line | awk '{print $1}')
    status=$(echo $line | awk '{print $3}')
    if [ "$status" == "Running" ]; then
        echo -e "[\${GREEN}✓\${NC}] Pod $pod_name is running"
    else
        echo -e "[\${YELLOW}!\${NC}] Pod $pod_name status: $status"
    fi
done

# Check services
echo ""
echo "🌐 Checking Services..."
kubectl get svc autodeployx-service --no-headers 2>/dev/null && \\
    echo -e "[\${GREEN}✓\${NC}] Service is deployed" || \\
    echo -e "[\${RED}✗\${NC}] Service not found"

# Check Jenkins
echo ""
echo "🔧 Checking Jenkins..."
check_service "Jenkins" "http://localhost:8080/login"

echo ""
echo "=========================="
echo "Health check completed!"`,
  },
  {
    name: "deploy.sh",
    path: "scripts/deploy.sh",
    language: "bash",
    content: `#!/bin/bash

# AutoDeployX Deployment Script
# This script handles the full deployment to Minikube

set -e

echo "🚀 AutoDeployX Deployment"
echo "========================"

# Configuration
IMAGE_NAME="yourusername/autodeployx"
IMAGE_TAG=\${1:-latest}

# Step 1: Start Minikube if not running
echo ""
echo "📦 Checking Minikube..."
if ! minikube status | grep -q "Running"; then
    echo "Starting Minikube..."
    minikube start --cpus=2 --memory=4096
fi

# Step 2: Configure Docker to use Minikube's Docker daemon
echo ""
echo "🐳 Configuring Docker..."
eval $(minikube docker-env)

# Step 3: Build Docker image
echo ""
echo "🔨 Building Docker image..."
docker build -t \${IMAGE_NAME}:\${IMAGE_TAG} .

# Step 4: Apply Kubernetes configurations
echo ""
echo "☸️  Applying Kubernetes configurations..."

# Create namespace if not exists
kubectl create namespace autodeployx --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets
kubectl apply -f k8s/secrets.yaml -n autodeployx

# Apply deployment
kubectl apply -f k8s/deployment.yaml -n autodeployx

# Apply service
kubectl apply -f k8s/service.yaml -n autodeployx

# Step 5: Wait for deployment
echo ""
echo "⏳ Waiting for deployment to complete..."
kubectl rollout status deployment/autodeployx -n autodeployx

# Step 6: Get service URL
echo ""
echo "🌐 Getting service URL..."
minikube service autodeployx-service -n autodeployx --url

echo ""
echo "========================"
echo "✅ Deployment completed!"
echo ""
echo "Useful commands:"
echo "  kubectl get pods -n autodeployx"
echo "  kubectl logs -f deployment/autodeployx -n autodeployx"
echo "  minikube dashboard"`,
  },
  {
    name: "requirements.txt",
    path: "requirements.txt",
    language: "text",
    content: `# AutoDeployX Python Dependencies

# Web Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0

# Database
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1

# Redis
redis==5.0.1

# HTTP Client
httpx==0.25.2

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0

# Utilities
python-dotenv==1.0.0
pydantic==2.5.2
pydantic-settings==2.1.0

# Monitoring
prometheus-client==0.19.0

# Logging
structlog==23.2.0`,
  },
  {
    name: "backup.sh",
    path: "scripts/backup.sh",
    language: "bash",
    content: `#!/bin/bash

# AutoDeployX Backup Script
# Backs up PostgreSQL database and important configurations

set -e

BACKUP_DIR="/backups/autodeployx"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

echo "📦 AutoDeployX Backup Script"
echo "=========================="
echo "Date: $DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
echo ""
echo "🗄️  Backing up PostgreSQL..."
kubectl exec -n autodeployx deployment/postgres -- \\
    pg_dump -U user autodeployx | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup Kubernetes configurations
echo ""
echo "☸️  Backing up Kubernetes configs..."
kubectl get all -n autodeployx -o yaml > "$BACKUP_DIR/k8s_$DATE.yaml"

# Backup secrets (encrypted)
echo ""
echo "🔐 Backing up secrets..."
kubectl get secrets -n autodeployx -o yaml | \\
    gpg --symmetric --cipher-algo AES256 > "$BACKUP_DIR/secrets_$DATE.yaml.gpg"

# Cleanup old backups
echo ""
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

# List backups
echo ""
echo "📋 Current backups:"
ls -lh $BACKUP_DIR

echo ""
echo "=========================="
echo "✅ Backup completed!"
echo "Location: $BACKUP_DIR"`,
  },
];

interface ConfigFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConfigFilesModal({ isOpen, onClose }: ConfigFilesModalProps) {
  const [selectedFile, setSelectedFile] = useState(configFiles[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    configFiles.forEach((file) => {
      const blob = new Blob([file.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    toast.success("All files downloaded!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <FileCode className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              DevOps Configuration Files
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadAll}>
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[70vh]">
          {/* File List */}
          <div className="w-64 border-r border-border p-4 overflow-y-auto">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Files
            </h3>
            <div className="space-y-1">
              {configFiles.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedFile.path === file.path
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="font-medium">{file.name}</div>
                  <div className="text-xs opacity-70">{file.path}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Code View */}
          <div className="flex-1 flex flex-col">
            {/* File Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-foreground">
                  {selectedFile.path}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                  {selectedFile.language}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Code Content */}
            <pre className="flex-1 p-4 overflow-auto font-mono text-sm text-foreground bg-background/50">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
