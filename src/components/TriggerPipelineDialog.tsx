import { useState } from "react";
import { Rocket, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "./ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

interface TriggerPipelineDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
}

export function TriggerPipelineDialog({ 
  isOpen, 
  onOpenChange, 
  isConnected 
}: TriggerPipelineDialogProps) {
  const [environment, setEnvironment] = useState("dev");
  const [skipTests, setSkipTests] = useState(false);
  const [skipSecurityScan, setSkipSecurityScan] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const { toast: showToast } = useToast();

  const handleTrigger = async () => {
    if (!isConnected) {
      showToast({
        title: "Backend Disconnected",
        description: "Cannot trigger pipeline. Backend is not connected.",
        variant: "destructive",
      });
      return;
    }

    setIsTriggering(true);
    
    try {
      const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      
      const response = await fetch(`${backendURL}/pipelines/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          environment,
          skip_tests: skipTests,
          skip_security_scan: skipSecurityScan,
          deploy_tag: "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to trigger pipeline");
      }

      const data = await response.json();

      toast.success("Pipeline Triggered! 🚀", {
        description: `Pipeline ${data.id} is now queued and will start shortly.`,
      });

      onOpenChange(false);
      setEnvironment("dev");
      setSkipTests(false);
      setSkipSecurityScan(false);
    } catch (error) {
      toast.error("Failed to trigger pipeline", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-[0.1em]">
            Trigger Pipeline
          </DialogTitle>
          <DialogDescription>
            Start the AutoDeployX pipeline with your preferred settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isConnected && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Backend is not connected. Pipeline trigger may fail.
              </AlertDescription>
            </Alert>
          )}

          {/* Environment Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Environment</label>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dev">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="prod">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Skip Tests */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="skip-tests"
              checked={skipTests}
              onChange={(e) => setSkipTests(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="skip-tests" className="text-sm cursor-pointer">
              Skip unit tests & linting
            </label>
          </div>

          {/* Skip Security Scan */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="skip-security"
              checked={skipSecurityScan}
              onChange={(e) => setSkipSecurityScan(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="skip-security" className="text-sm cursor-pointer">
              Skip security scanning
            </label>
          </div>

          {/* What This Does */}
          <div className="bg-secondary/50 rounded-lg p-4 text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Pipeline will execute:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>📥 Checkout code from repository</li>
              <li>🧪 Run unit tests & linting{skipTests ? " (skipped)" : ""}</li>
              <li>🐳 Build Docker image</li>
              <li>🔒 Security scanning{skipSecurityScan ? " (skipped)" : ""}</li>
              <li>📤 Push image to DockerHub</li>
              <li>⚙️ Deploy to Minikube</li>
              <li>✅ Health checks & smoke tests</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isTriggering}
          >
            Cancel
          </Button>
          <Button
            variant="glow"
            onClick={handleTrigger}
            disabled={isTriggering || !isConnected}
            className="gap-2"
          >
            <Rocket className="w-4 h-4" />
            {isTriggering ? "Triggering..." : "Trigger Pipeline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
