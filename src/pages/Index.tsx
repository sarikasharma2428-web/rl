import { useState } from "react";
import {
  Rocket,
  Container,
  GitBranch,
  CheckCircle,
  Clock,
  Activity,
} from "lucide-react";
import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { PipelineCard } from "@/components/PipelineCard";
import { InfrastructureTopology } from "@/components/InfrastructureTopology";
import { TerminalOutput } from "@/components/TerminalOutput";
import { QuickActions } from "@/components/QuickActions";
import { ConfigFilesModal } from "@/components/ConfigFilesModal";

const mockPipelines = [
  {
    name: "autodeployx-backend",
    branch: "main",
    commit: "a3f2d1c",
    author: "sarika-03",
    stages: [
      { name: "Checkout", status: "success" as const, duration: "2s" },
      { name: "Build", status: "success" as const, duration: "45s" },
      { name: "Test", status: "success" as const, duration: "1m 23s" },
      { name: "Push", status: "success" as const, duration: "32s" },
      { name: "Deploy", status: "running" as const },
    ],
    startedAt: "2 minutes ago",
  },
  {
    name: "autodeployx-frontend",
    branch: "feature/dashboard",
    commit: "b7e4f2a",
    author: "dev-team",
    stages: [
      { name: "Checkout", status: "success" as const, duration: "1s" },
      { name: "Build", status: "success" as const, duration: "1m 12s" },
      { name: "Test", status: "failed" as const, duration: "45s" },
      { name: "Push", status: "pending" as const },
      { name: "Deploy", status: "pending" as const },
    ],
    startedAt: "15 minutes ago",
  },
  {
    name: "database-migrations",
    branch: "main",
    commit: "c9d8e7f",
    author: "dba-team",
    stages: [
      { name: "Checkout", status: "success" as const, duration: "1s" },
      { name: "Validate", status: "success" as const, duration: "5s" },
      { name: "Migrate", status: "success" as const, duration: "12s" },
      { name: "Verify", status: "success" as const, duration: "3s" },
    ],
    startedAt: "1 hour ago",
  },
];

const mockLogs = [
  { timestamp: "14:32:05", level: "info" as const, message: "Starting deployment pipeline..." },
  { timestamp: "14:32:06", level: "info" as const, message: "Pulling latest code from GitHub..." },
  { timestamp: "14:32:08", level: "success" as const, message: "Code checkout complete" },
  { timestamp: "14:32:10", level: "info" as const, message: "Building Docker image: autodeployx:v1.2.3" },
  { timestamp: "14:32:45", level: "success" as const, message: "Docker image built successfully" },
  { timestamp: "14:32:47", level: "info" as const, message: "Running test suite..." },
  { timestamp: "14:34:10", level: "success" as const, message: "All 47 tests passed" },
  { timestamp: "14:34:12", level: "info" as const, message: "Pushing image to DockerHub..." },
  { timestamp: "14:34:44", level: "success" as const, message: "Image pushed: yourusername/autodeployx:v1.2.3" },
  { timestamp: "14:34:46", level: "info" as const, message: "Deploying to Minikube cluster..." },
  { timestamp: "14:34:48", level: "info" as const, message: "kubectl set image deployment/autodeployx..." },
  { timestamp: "14:35:02", level: "success" as const, message: "Deployment rollout complete - 3/3 pods ready" },
];

export default function Index() {
  const [showConfigFiles, setShowConfigFiles] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage your CI/CD pipelines with Minikube & DockerHub
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Deployments"
            value="247"
            subtitle="This month"
            icon={Rocket}
            trend={{ value: 12, isPositive: true }}
          />
          <MetricCard
            title="Docker Images"
            value="18"
            subtitle="In DockerHub"
            icon={Container}
            trend={{ value: 3, isPositive: true }}
          />
          <MetricCard
            title="Active Pipelines"
            value="5"
            subtitle="Currently running"
            icon={Activity}
          />
          <MetricCard
            title="Success Rate"
            value="94.2%"
            subtitle="Last 30 days"
            icon={CheckCircle}
            trend={{ value: 2.1, isPositive: true }}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions onViewFiles={() => setShowConfigFiles(true)} />
        </div>

        {/* Infrastructure Topology */}
        <div className="mb-8">
          <InfrastructureTopology />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pipelines */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              Recent Pipelines
            </h3>
            <div className="space-y-4">
              {mockPipelines.map((pipeline) => (
                <PipelineCard key={pipeline.name + pipeline.commit} {...pipeline} />
              ))}
            </div>
          </div>

          {/* Logs */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Live Deployment Logs
            </h3>
            <TerminalOutput logs={mockLogs} />
          </div>
        </div>
      </main>

      {/* Config Files Modal */}
      <ConfigFilesModal
        isOpen={showConfigFiles}
        onClose={() => setShowConfigFiles(false)}
      />
    </div>
  );
}
