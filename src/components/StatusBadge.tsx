import { cn } from "@/lib/utils";

type Status = "success" | "running" | "pending" | "failed";

interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
}

const statusConfig = {
  success: {
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
    label: "Success",
  },
  running: {
    bg: "bg-primary/10",
    text: "text-primary",
    dot: "bg-primary",
    label: "Running",
  },
  pending: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    label: "Pending",
  },
  failed: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
    label: "Failed",
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full status-indicator",
          config.dot,
          status === "running" && "active"
        )}
      />
      {label || config.label}
    </span>
  );
}
