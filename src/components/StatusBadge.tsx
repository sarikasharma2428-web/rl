import { cn } from "@/lib/utils";

type Status = "success" | "running" | "pending" | "failed";

interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
}

const statusConfig = {
  success: {
    bg: "bg-success/20",
    text: "text-success",
    dot: "bg-success",
    label: "Success",
  },
  running: {
    bg: "bg-primary/20",
    text: "text-primary",
    dot: "bg-primary",
    label: "Running",
  },
  pending: {
    bg: "bg-warning/20",
    text: "text-warning",
    dot: "bg-warning",
    label: "Pending",
  },
  failed: {
    bg: "bg-destructive/20",
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
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium font-mono",
        config.bg,
        config.text,
        className
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          config.dot,
          status === "running" && "animate-pulse"
        )}
      />
      {label || config.label}
    </span>
  );
}
