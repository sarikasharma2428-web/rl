import { Server, Database, Container, Globe, Box, ArrowRight, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeProps {
  icon: React.ReactNode;
  label: string;
  status: "healthy" | "warning" | "error";
  details?: string;
  role?: string;
}

function TopologyNode({ icon, label, status, details, role }: NodeProps) {
  return (
    <div className="flex flex-col items-center p-5 bg-card border border-border/30 group card-hover cursor-pointer">
      {/* Top accent */}
      <div className={cn(
        "w-8 h-0.5 -mt-5 mb-4",
        status === "healthy" && "bg-success",
        status === "warning" && "bg-warning",
        status === "error" && "bg-destructive"
      )} />
      
      <div className={cn(
        "p-4 border mb-3 transition-all group-hover:scale-110",
        status === "healthy" && "border-success/30 text-success",
        status === "warning" && "border-warning/30 text-warning",
        status === "error" && "border-destructive/30 text-destructive"
      )}>
        {icon}
      </div>
      
      <span className="font-display text-xs tracking-[0.15em] text-foreground">{label.toUpperCase()}</span>
      {details && (
        <span className="text-[10px] text-muted-foreground mt-1">{details}</span>
      )}
      {role && (
        <span className="text-[9px] text-primary/70 mt-0.5 italic">{role}</span>
      )}
      
      <div className={cn(
        "w-2 h-2 mt-3 status-indicator",
        status === "healthy" && "bg-success active",
        status === "warning" && "bg-warning active",
        status === "error" && "bg-destructive active"
      )} />
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center px-2">
      <ArrowRight className="w-5 h-5 text-primary/50" />
      <span className="text-[8px] text-muted-foreground mt-1 uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

export function InfrastructureTopology() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-6">
        {/* Section Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-gold text-xs">◆ ◆ ◆</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl tracking-[0.15em] text-foreground mb-4">
            INFRASTRUCTURE FLOW
          </h2>
          <p className="font-serif text-lg text-muted-foreground italic max-w-xl mx-auto">
            Complete CI/CD pipeline: Dashboard → Jenkins → DockerHub → Kubernetes
          </p>
        </div>

        {/* Pipeline Flow - Explicit arrows */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-0 mb-8">
          <TopologyNode 
            icon={<Monitor className="w-5 h-5" />} 
            label="Dashboard" 
            status="healthy" 
            details="React App"
            role="Triggers & Views"
          />
          <FlowArrow label="Trigger" />
          
          <TopologyNode 
            icon={<Server className="w-5 h-5" />} 
            label="Backend" 
            status="healthy" 
            details="FastAPI"
            role="API + WebSocket"
          />
          <FlowArrow label="Webhook" />
          
          <TopologyNode 
            icon={<Globe className="w-5 h-5" />} 
            label="Jenkins" 
            status="healthy" 
            details="CI/CD Engine"
            role="OWNS Pipeline"
          />
          <FlowArrow label="docker push" />
          
          <TopologyNode 
            icon={<Container className="w-5 h-5" />} 
            label="DockerHub" 
            status="healthy" 
            details="Registry"
            role="Store Images"
          />
          <FlowArrow label="kubectl apply" />
          
          <TopologyNode 
            icon={<Box className="w-5 h-5" />} 
            label="Minikube" 
            status="healthy" 
            details="K8s Cluster"
            role="Run Pods"
          />
        </div>

        {/* JENKINS - What It Does (Interview Ready) */}
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-primary/5 border-2 border-primary/30">
          <h3 className="font-display text-sm tracking-[0.15em] text-primary mb-4 text-center">
            🔧 JENKINS DOES 4 THINGS ONLY
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
            <div className="p-3 bg-card border border-primary/20 text-center">
              <p className="text-primary font-bold text-lg mb-1">1</p>
              <p className="text-foreground font-medium">Pull Code</p>
              <p className="text-muted-foreground text-[10px]">from GitHub</p>
            </div>
            <div className="p-3 bg-card border border-primary/20 text-center">
              <p className="text-primary font-bold text-lg mb-1">2</p>
              <p className="text-foreground font-medium">Build Image</p>
              <p className="text-muted-foreground text-[10px]">docker build</p>
            </div>
            <div className="p-3 bg-card border border-primary/20 text-center">
              <p className="text-primary font-bold text-lg mb-1">3</p>
              <p className="text-foreground font-medium">Push Image</p>
              <p className="text-muted-foreground text-[10px]">to DockerHub</p>
            </div>
            <div className="p-3 bg-card border border-primary/20 text-center">
              <p className="text-primary font-bold text-lg mb-1">4</p>
              <p className="text-foreground font-medium">Deploy</p>
              <p className="text-muted-foreground text-[10px]">to Minikube</p>
            </div>
          </div>
          
          {/* Docker Build Command */}
          <div className="p-3 bg-card border border-border/30 font-mono text-xs text-center">
            <span className="text-muted-foreground">Jenkins runs: </span>
            <code className="text-primary">docker build -t sarika1731/autodeployx:&lt;build_number&gt; .</code>
          </div>
        </div>

        {/* WHO DOES NOT BUILD IMAGES */}
        <div className="max-w-4xl mx-auto mt-4 p-4 bg-destructive/5 border border-destructive/30">
          <h3 className="font-display text-xs tracking-[0.15em] text-destructive mb-3 text-center">
            ❌ WHO DOES NOT BUILD IMAGES
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-card border border-destructive/20 text-center">
              <p className="text-destructive font-medium">❌ Backend</p>
              <p className="text-muted-foreground text-[10px]">Only receives webhooks & broadcasts</p>
            </div>
            <div className="p-3 bg-card border border-destructive/20 text-center">
              <p className="text-destructive font-medium">❌ Frontend</p>
              <p className="text-muted-foreground text-[10px]">Only displays data & triggers</p>
            </div>
          </div>
        </div>

        {/* Key Architecture Points */}
        <div className="max-w-3xl mx-auto mt-6 p-6 bg-secondary/30 border border-border/30">
          <h3 className="font-display text-sm tracking-[0.15em] text-foreground mb-4 text-center">
            KEY ARCHITECTURE POINTS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-card border border-border/20">
              <p className="text-primary font-medium mb-1">1. Jenkins Owns Pipeline</p>
              <p className="text-muted-foreground">
                Backend <span className="text-foreground">triggers</span> Jenkins. 
                Jenkins <span className="text-foreground">builds, pushes, deploys</span>.
              </p>
            </div>
            <div className="p-3 bg-card border border-border/20">
              <p className="text-primary font-medium mb-1">2. Jenkins → DockerHub</p>
              <p className="text-muted-foreground">
                Jenkins runs <code className="text-foreground">docker build</code> + 
                <code className="text-foreground"> docker push</code> to registry.
              </p>
            </div>
            <div className="p-3 bg-card border border-border/20">
              <p className="text-primary font-medium mb-1">3. Kubeconfig Mount</p>
              <p className="text-muted-foreground">
                Backend needs <code className="text-foreground">~/.kube</code> mounted 
                for real <code className="text-foreground">kubectl</code> access.
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex items-center justify-center gap-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-3 h-3 bg-success" />
            <span className="uppercase tracking-wider">Healthy</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-3 h-3 bg-warning" />
            <span className="uppercase tracking-wider">Warning</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-3 h-3 bg-destructive" />
            <span className="uppercase tracking-wider">Error</span>
          </div>
        </div>
      </div>
    </section>
  );
}
