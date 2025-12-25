import { Server, Database, Container, Globe, Box, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeProps {
  icon: React.ReactNode;
  label: string;
  status: "healthy" | "warning" | "error";
  details?: string;
  className?: string;
}

function TopologyNode({ icon, label, status, details, className }: NodeProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center p-4 bg-secondary/50 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer",
        className
      )}
    >
      <div
        className={cn(
          "p-3 rounded-lg mb-2 transition-colors",
          status === "healthy" && "bg-success/20 text-success",
          status === "warning" && "bg-warning/20 text-warning",
          status === "error" && "bg-destructive/20 text-destructive"
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {details && (
        <span className="text-xs text-muted-foreground mt-1">{details}</span>
      )}
      <div
        className={cn(
          "w-2 h-2 rounded-full mt-2",
          status === "healthy" && "bg-success",
          status === "warning" && "bg-warning animate-pulse",
          status === "error" && "bg-destructive animate-pulse"
        )}
      />
    </div>
  );
}

export function InfrastructureTopology() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-primary" />
        Infrastructure Topology
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Git Source */}
        <TopologyNode
          icon={<Globe className="w-6 h-6" />}
          label="GitHub"
          status="healthy"
          details="Source"
        />

        {/* Jenkins */}
        <TopologyNode
          icon={<Server className="w-6 h-6" />}
          label="Jenkins"
          status="healthy"
          details="CI/CD"
        />

        {/* DockerHub */}
        <TopologyNode
          icon={<Container className="w-6 h-6" />}
          label="DockerHub"
          status="healthy"
          details="Registry"
        />

        {/* Minikube */}
        <TopologyNode
          icon={<Box className="w-6 h-6" />}
          label="Minikube"
          status="healthy"
          details="K8s Cluster"
        />

        {/* Services */}
        <TopologyNode
          icon={<Server className="w-6 h-6" />}
          label="Services"
          status="healthy"
          details="3 Pods"
        />

        {/* Database */}
        <TopologyNode
          icon={<Database className="w-6 h-6" />}
          label="PostgreSQL"
          status="healthy"
          details="Database"
        />
      </div>

      {/* Connection lines (simplified visual) */}
      <div className="mt-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-success" />
          <span>Healthy</span>
          <span className="w-3 h-3 rounded-full bg-warning ml-4" />
          <span>Warning</span>
          <span className="w-3 h-3 rounded-full bg-destructive ml-4" />
          <span>Error</span>
        </div>
      </div>
    </div>
  );
}
