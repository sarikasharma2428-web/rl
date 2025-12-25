import { GitBranch, Clock, User } from "lucide-react";
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
        "group relative bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <GitBranch className="w-4 h-4" />
                {branch}
              </span>
              <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">
                {commit}
              </span>
            </div>
          </div>
          <StatusBadge status={overallStatus} />
        </div>

        {/* Pipeline Stages */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {stages.map((stage, index) => (
            <div key={stage.name} className="flex items-center">
              <div
                className={cn(
                  "flex flex-col items-center px-3 py-2 rounded-lg border transition-all",
                  stage.status === "success" &&
                    "bg-success/10 border-success/30",
                  stage.status === "running" &&
                    "bg-primary/10 border-primary/30 animate-pulse",
                  stage.status === "pending" &&
                    "bg-muted border-border",
                  stage.status === "failed" &&
                    "bg-destructive/10 border-destructive/30"
                )}
              >
                <span className="text-xs font-medium text-foreground whitespace-nowrap">
                  {stage.name}
                </span>
                {stage.duration && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {stage.duration}
                  </span>
                )}
              </div>
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    stage.status === "success"
                      ? "bg-success"
                      : "bg-border"
                  )}
                />
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
