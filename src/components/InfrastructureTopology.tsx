import { Server, Database, Container, Globe, Box, Cpu, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeProps {
  icon: React.ReactNode;
  label: string;
  status: "healthy" | "warning" | "error";
  details?: string;
}

function TopologyNode({ icon, label, status, details }: NodeProps) {
  return (
    <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 group cursor-pointer hover-lift">
      <div
        className={cn(
          "p-3 rounded-xl mb-3 transition-all duration-300 group-hover:scale-110",
          status === "healthy" && "bg-success/10 text-success",
          status === "warning" && "bg-warning/10 text-warning",
          status === "error" && "bg-destructive/10 text-destructive"
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
          "w-2 h-2 rounded-full mt-3 status-indicator",
          status === "healthy" && "bg-success active",
          status === "warning" && "bg-warning active",
          status === "error" && "bg-destructive active"
        )}
      />
    </div>
  );
}

export function InfrastructureTopology() {
  const nodes = [
    { icon: <Globe className="w-5 h-5" />, label: "GitHub", status: "healthy" as const, details: "Source" },
    { icon: <Server className="w-5 h-5" />, label: "Jenkins", status: "healthy" as const, details: "CI/CD" },
    { icon: <Container className="w-5 h-5" />, label: "DockerHub", status: "healthy" as const, details: "Registry" },
    { icon: <Box className="w-5 h-5" />, label: "Minikube", status: "healthy" as const, details: "K8s Cluster" },
    { icon: <Server className="w-5 h-5" />, label: "Services", status: "healthy" as const, details: "3 Pods" },
    { icon: <Database className="w-5 h-5" />, label: "PostgreSQL", status: "healthy" as const, details: "Database" },
  ];

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Cpu className="w-5 h-5 text-primary" />
        </div>
        Infrastructure Topology
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {nodes.map((node, index) => (
          <div key={node.label} className="flex items-center">
            <TopologyNode {...node} />
            {index < nodes.length - 1 && (
              <ArrowRight className="w-4 h-4 text-muted-foreground mx-2 hidden lg:block" />
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-success" />
          <span>Healthy</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-warning" />
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span>Error</span>
        </div>
      </div>
    </div>
  );
}
