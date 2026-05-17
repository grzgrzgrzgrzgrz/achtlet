import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Download, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPWAProps {
  className?: string;
}

const DISMISS_KEY = "achtlet.install-banner.dismissed-at";
const DISMISS_FOR_MS = 3 * 24 * 60 * 60 * 1000;

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

const InstallPWA: React.FC<InstallPWAProps> = ({ className }) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    if (isInstalled()) {
      return;
    }

    const dismissedAt = Number.parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_FOR_MS) {
      return;
    }

    const isAndroid = /Android/i.test(navigator.userAgent);
    setShowManualInstructions(isAndroid);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const timeout = window.setTimeout(() => {
      if (isAndroid && !isInstalled()) {
        setShowInstallBanner(true);
      }
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowInstallBanner(false);
  };

  const handleInstallClick = async () => {
    if (!installPrompt) {
      dismiss();
      return;
    }

    await installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choiceResult.outcome === "dismissed") {
      dismiss();
      return;
    }

    setShowInstallBanner(false);
  };

  if (!showInstallBanner) {
    return null;
  }

  return (
    <div className={`sticky-install ${className || ""}`}>
      <div className="surface-panel-strong border-l-4 border-l-[hsl(var(--primary))] p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="mt-0.5 rounded-2xl bg-[hsl(var(--accent))] p-2 text-[hsl(var(--primary))]">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[hsl(var(--text-dark))]">
                Install Achtlet on Android
              </p>
              <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                {installPrompt
                  ? "Add the PWA to your launcher for full-screen access and faster relaunch."
                  : showManualInstructions
                    ? 'Use Chrome\'s menu and choose "Install app" or "Add to Home screen".'
                    : "This browser can install Achtlet as a standalone app when the prompt becomes available."}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {installPrompt && (
          <Button
            variant="default"
            className="mt-4 h-11 w-full rounded-2xl border-b-4 border-b-[hsl(var(--highlight-color))]"
            onClick={handleInstallClick}
          >
            <Download className="mr-2 h-4 w-4" />
            Install App
          </Button>
        )}

        {!installPrompt && showManualInstructions && (
          <Button
            variant="outline"
            className="mt-4 h-11 w-full rounded-2xl border-[hsl(var(--border))]"
            onClick={dismiss}
          >
            Keep browsing
          </Button>
        )}
      </div>
    </div>
  );
};

export default InstallPWA;
