import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;

    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (!active) {
          return;
        }

        if (response.ok || response.status === 401) {
          const data = await response.json().catch(() => ({ authenticated: false }));
          setIsAuthenticated(data.authenticated);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        if (active) {
          setIsAuthenticated(false);
        }
      } finally {
        if (active) {
          setIsCheckingAuth(false);
        }
      }
    };

    const handleVisibilityCheck = () => {
      if (document.visibilityState === "visible") {
        void checkAuthStatus();
      }
    };

    void checkAuthStatus();
    window.addEventListener("focus", handleVisibilityCheck);
    document.addEventListener("visibilitychange", handleVisibilityCheck);

    return () => {
      active = false;
      window.removeEventListener("focus", handleVisibilityCheck);
      document.removeEventListener("visibilitychange", handleVisibilityCheck);
    };
  }, []);

  const handleLogin = async (password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ password }),
        credentials: "include",
      });

      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoading(true);

    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      setIsAuthenticated(false);
      setIsLoading(false);
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="screen-shell flex items-center justify-center">
        <div className="surface-panel-strong w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-[3px] border-[hsl(var(--border))] border-t-[hsl(var(--primary))]" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--highlight-color))]">
            Session check
          </p>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Restoring your Achtlet session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/login">
          {isAuthenticated ? (
            <Redirect to="/" />
          ) : (
            <Login onLogin={handleLogin} isLoading={isLoading} />
          )}
        </Route>

        <Route path="/auth">
          {isAuthenticated ? (
            <Redirect to="/" />
          ) : (
            <Login onLogin={handleLogin} isLoading={isLoading} />
          )}
        </Route>

        <Route path="/">
          {isAuthenticated ? (
            <Dashboard onLogout={handleLogout} />
          ) : (
            <Redirect to="/login" />
          )}
        </Route>

        <Route>
          <NotFound />
        </Route>
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
