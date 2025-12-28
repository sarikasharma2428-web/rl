"""
Database Models for AutoDeployX
SQLAlchemy ORM models for persistence
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, Enum as SQLEnum, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class PipelineStatus(str, enum.Enum):
    """Pipeline execution status"""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    ABORTED = "aborted"

class StageStatus(str, enum.Enum):
    """Stage execution status"""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"

class PipelineExecution(Base):
    """Pipeline execution record"""
    __tablename__ = "pipeline_executions"
    
    id = Column(String(50), primary_key=True)
    pipeline_name = Column(String(100), nullable=False)
    build_number = Column(Integer, nullable=False)
    status = Column(SQLEnum(PipelineStatus), default=PipelineStatus.PENDING)
    branch = Column(String(100), default="main")
    environment = Column(String(50), default="dev")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    jenkins_queue_id = Column(String(100), nullable=True)
    jenkins_build_number = Column(Integer, nullable=True)
    
    # Relationships
    stages = relationship("PipelineStage", back_populates="pipeline", cascade="all, delete-orphan")
    logs = relationship("PipelineLog", back_populates="pipeline", cascade="all, delete-orphan")
    deployment = relationship("DeploymentRecord", back_populates="pipeline", uselist=False)
    
    def __repr__(self):
        return f"<PipelineExecution {self.id} - {self.status}>"

class PipelineStage(Base):
    """Individual pipeline stage execution"""
    __tablename__ = "pipeline_stages"
    
    id = Column(String(50), primary_key=True)
    pipeline_id = Column(String(50), ForeignKey("pipeline_executions.id"), nullable=False)
    stage_name = Column(String(100), nullable=False)
    status = Column(SQLEnum(StageStatus), default=StageStatus.PENDING)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    pipeline = relationship("PipelineExecution", back_populates="stages")
    
    def __repr__(self):
        return f"<PipelineStage {self.stage_name} - {self.status}>"

class PipelineLog(Base):
    """Pipeline execution logs"""
    __tablename__ = "pipeline_logs"
    
    id = Column(String(50), primary_key=True)
    pipeline_id = Column(String(50), ForeignKey("pipeline_executions.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    level = Column(String(20), default="info")  # info, success, error, warning
    message = Column(Text, nullable=False)
    stage = Column(String(100), nullable=True)
    
    # Relationships
    pipeline = relationship("PipelineExecution", back_populates="logs")
    
    def __repr__(self):
        return f"<PipelineLog {self.level} - {self.message[:50]}>"

class DockerImage(Base):
    """Docker image record"""
    __tablename__ = "docker_images"
    
    id = Column(String(50), primary_key=True)
    repository = Column(String(200), nullable=False)
    tag = Column(String(100), nullable=False)
    image_hash = Column(String(100), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    pushed_at = Column(DateTime, default=datetime.utcnow)
    pipeline_id = Column(String(50), nullable=True)
    
    def __repr__(self):
        return f"<DockerImage {self.repository}:{self.tag}>"

class DeploymentRecord(Base):
    """Kubernetes deployment record"""
    __tablename__ = "deployments"
    
    id = Column(String(50), primary_key=True)
    pipeline_id = Column(String(50), ForeignKey("pipeline_executions.id"), nullable=True)
    deployment_name = Column(String(100), nullable=False)
    namespace = Column(String(100), default="default")
    image = Column(String(200), nullable=False)
    tag = Column(String(100), nullable=False)
    desired_replicas = Column(Integer, default=3)
    ready_replicas = Column(Integer, default=0)
    deployed_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="pending")  # pending, running, success, failed
    
    # Relationships
    pipeline = relationship("PipelineExecution", back_populates="deployment")
    
    def __repr__(self):
        return f"<DeploymentRecord {self.deployment_name} - {self.status}>"

class Pod(Base):
    """Kubernetes pod record"""
    __tablename__ = "pods"
    
    id = Column(String(50), primary_key=True)
    pod_name = Column(String(100), nullable=False)
    deployment_id = Column(String(50), ForeignKey("deployments.id"), nullable=True)
    namespace = Column(String(100), default="default")
    status = Column(String(50), default="pending")  # running, pending, failed, terminated
    restarts = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Pod {self.pod_name} - {self.status}>"
