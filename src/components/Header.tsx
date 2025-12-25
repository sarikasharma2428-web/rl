import { Rocket, Github, Bell, Settings, Menu } from "lucide-react";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative p-2.5 bg-gradient-primary rounded-xl">
                <Rocket className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Auto<span className="text-gradient">DeployX</span>
              </h1>
              <p className="text-xs text-muted-foreground tracking-wide">
                DevOps Automation Platform
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative hidden sm:flex">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full status-indicator active" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Github className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="glow" size="sm" className="hidden sm:flex">
              New Pipeline
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
