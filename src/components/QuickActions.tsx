import { Play, RotateCcw, Pause, Settings, Download, FileCode } from "lucide-react";
import { Button } from "./ui/button";

interface QuickActionsProps {
  onViewFiles?: () => void;
}

export function QuickActions({ onViewFiles }: QuickActionsProps) {
  const actions = [
    { icon: Play, label: "Deploy Now", variant: "glow" as const },
    { icon: RotateCcw, label: "Rollback", variant: "outline" as const },
    { icon: Pause, label: "Pause", variant: "outline" as const },
    { icon: Settings, label: "Configure", variant: "outline" as const },
    { icon: Download, label: "Logs", variant: "outline" as const },
  ];

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-5">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map(({ icon: Icon, label, variant }) => (
          <Button
            key={label}
            variant={variant}
            className="flex flex-col gap-2 h-auto py-4 px-3"
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        ))}
      </div>

      <div className="mt-5 pt-5 border-t border-border/50">
        <Button
          variant="terminal"
          className="w-full justify-start gap-3 h-12"
          onClick={onViewFiles}
        >
          <FileCode className="w-5 h-5" />
          <span>View DevOps Configuration Files</span>
        </Button>
      </div>
    </div>
  );
}
