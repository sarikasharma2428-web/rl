import { GitBranch, Clock, User, ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

interface PipelineStage {
  name: string;
  status: "success" | "running" | "pending" | "failed";
  duration?: string;
}

interface PipelineCardProps {
  name: string;
  branch: string;
  commit: string;
  author: string;
  stages: PipelineStage[];
  startedAt: string;
  className?: string;
}

export function PipelineCard({
  name,
  branch,
  commit,
  author,
  stages,
  startedAt,
  className,
}: PipelineCardProps) {
  const overallStatus = stages.some((s) => s.status === "failed")
    ? "failed"
    : stages.some((s) => s.status === "running")
    ? "running"
    : stages.every((s) => s.status === "success")
    ? "success"
    : "pending";

  return (
    <div
      className={cn(
        "group relative bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 hover-lift cursor-pointer",
        className
      )}
    >
      {/* Left accent bar */}
      <div className={cn(
        "absolute left-0 top-4 bottom-4 w-1 rounded-full transition-all duration-300",
        overallStatus === "success" && "bg-success",
        overallStatus === "running" && "bg-primary",
        overallStatus === "pending" && "bg-muted-foreground",
        overallStatus === "failed" && "bg-destructive"
      )} />

      <div className="pl-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                {branch}
              </span>
              <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded-md border border-border/50">
                {commit}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={overallStatus} />
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          {stages.map((stage, index) => (
            <div key={stage.name} className="flex items-center">
              <div
                className={cn(
                  "flex flex-col items-center px-3 py-1.5 rounded-lg text-xs transition-all",
                  stage.status === "success" && "bg-success/10 text-success",
                  stage.status === "running" && "bg-primary/10 text-primary",
                  stage.status === "pending" && "bg-muted text-muted-foreground",
                  stage.status === "failed" && "bg-destructive/10 text-destructive"
                )}
              >
                <span className="font-medium whitespace-nowrap">{stage.name}</span>
                {stage.duration && (
                  <span className="text-[10px] opacity-70 font-mono">{stage.duration}</span>
                )}
              </div>
              {index < stages.length - 1 && (
                <div className={cn(
                  "w-4 h-px mx-0.5",
                  stage.status === "success" ? "bg-success/50" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {author}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {startedAt}
          </span>
        </div>
      </div>
    </div>
  );
}
