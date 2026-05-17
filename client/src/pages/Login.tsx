import React, { useState } from "react";
import { useLocation } from "wouter";
import AchtletLogo from "@/components/AchtletLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LoginProps {
  onLogin: (password: string) => Promise<boolean>;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading }) => {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setErrorMessage("Password is required");
      return;
    }

    setErrorMessage(null);

    try {
      const success = await onLogin(password);
      if (success) {
        setLocation("/");
      } else {
        setErrorMessage("Incorrect password. Please try again.");
      }
    } catch {
      setErrorMessage("An error occurred during login. Please try again.");
    }
  };

  return (
    <div className="screen-shell flex items-start sm:items-center">
      <div className="screen-frame grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="surface-panel-strong hidden min-h-[420px] flex-col justify-between p-8 lg:flex">
          <div>
            <p className="eyebrow">Android-first PWA</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[hsl(var(--text-dark))]">
              Pocket control for your n8n instance.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))]">
              Built to stay readable on grayscale hardware, then tuned so the color UI
              still feels deliberate on modern Android devices.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="metric-card">
              <p className="metric-label">Why install it</p>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Fast relaunch, full-screen app chrome, touch-sized controls, and direct
                access to workflows, executions, and backups.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="metric-card">
                <p className="metric-label">Workflows</p>
                <p className="metric-value">Toggle</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Executions</p>
                <p className="metric-value">Inspect</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Backups</p>
                <p className="metric-value">Archive</p>
              </div>
            </div>
          </div>
        </section>

        <Card className="surface-panel-strong rise-in w-full overflow-hidden border-0">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-[hsl(var(--border))] bg-white/90 shadow-[0_18px_30px_-24px_rgba(15,23,42,0.7)]">
                <AchtletLogo size={54} className="drop-shadow-sm" />
              </div>
              <p className="eyebrow justify-center">Achtlet</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[hsl(var(--text-dark))]">
                Secure Access
              </h2>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Sign in to reach your self-hosted n8n control surface.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label htmlFor="password" className="block text-sm font-semibold text-[hsl(var(--text-dark))]">
                App password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-[hsl(var(--border))] bg-white px-11 py-4 text-base text-[hsl(var(--text-dark))] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition focus:border-[hsl(var(--highlight-color))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--highlight-color))]/20"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-[hsl(var(--destructive))]/25 bg-[hsl(var(--destructive))]/8 px-4 py-3 text-sm font-medium text-[hsl(var(--destructive))]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 inline-block h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="mt-2 h-12 w-full rounded-2xl border-b-4 border-b-[hsl(var(--highlight-color))] text-base font-bold shadow-[0_18px_28px_-22px_rgba(195,64,38,0.95)]"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Open Dashboard"}
              </Button>

              <div className="rounded-2xl border border-[hsl(var(--border))] bg-white/70 px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                Install the PWA after login on Android to get a full-screen app with a
                proper launcher icon and fast relaunch.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
