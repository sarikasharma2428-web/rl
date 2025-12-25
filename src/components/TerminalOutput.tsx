import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

interface TerminalOutputProps {
  logs: LogEntry[];
  className?: string;
}

export function TerminalOutput({ logs, className }: TerminalOutputProps) {
  return (
    <div className={cn("bg-card border border-border/50 rounded-2xl overflow-hidden", className)}>
      {/* Terminal Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-secondary/80 border-b border-border/50">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/60 hover:bg-destructive transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-warning/60 hover:bg-warning transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-success/60 hover:bg-success transition-colors cursor-pointer" />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground font-mono">
            deployment-logs
          </span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono text-sm max-h-96 overflow-y-auto bg-background/50">
        {logs.map((log, index) => (
          <div
            key={index}
            className="flex gap-3 py-1.5 hover:bg-secondary/30 px-2 -mx-2 rounded transition-colors"
          >
            <span className="text-muted-foreground shrink-0 text-xs">
              {log.timestamp}
            </span>
            <span
              className={cn(
                "shrink-0 uppercase text-[10px] font-bold px-1.5 py-0.5 rounded",
                log.level === "info" && "bg-primary/20 text-primary",
                log.level === "success" && "bg-success/20 text-success",
                log.level === "warning" && "bg-warning/20 text-warning",
                log.level === "error" && "bg-destructive/20 text-destructive"
              )}
            >
              {log.level}
            </span>
            <span className="text-foreground/90">{log.message}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/30">
          <span className="text-primary font-bold">$</span>
          <span className="w-2.5 h-5 bg-primary/80 terminal-cursor rounded-sm" />
        </div>
      </div>
    </div>
  );
}
