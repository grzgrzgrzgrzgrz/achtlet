import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AchtletLogo from "@/components/AchtletLogo";
import WorkflowCard from "@/components/WorkflowCard";
import N8nConfigForm from "@/components/N8nConfigForm";
import InstallPWA from "@/components/InstallPWA";
import Executions from "@/pages/Executions";
import Backups from "@/pages/Backups";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchConfigState, fetchWorkflows } from "@/lib/api";
import type { N8nConfigState, Workflow } from "@shared/schema";
import {
  RefreshCw,
  AlertCircle,
  FileText,
  Settings,
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
  Power,
  Activity,
  Archive,
  Smartphone,
  ShieldCheck,
} from "lucide-react";

interface DashboardProps {
  onLogout: () => void;
}

type SortOption = "name-asc" | "name-desc" | "date-asc" | "date-desc" | "status";
type ViewMode = "workflows" | "executions" | "backups";

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [viewMode, setViewMode] = useState<ViewMode>("workflows");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get("view");
    if (view === "executions") {
      setViewMode("executions");
    } else if (view === "backups") {
      setViewMode("backups");
    }
  }, []);

  const { data: configState, isLoading: isConfigLoading } = useQuery<N8nConfigState>({
    queryKey: ["/api/config"],
    queryFn: fetchConfigState,
    retry: false,
  });

  const canLoadWorkflows = Boolean(configState?.configured);

  const { data: workflows, isLoading, isError, error } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
    queryFn: fetchWorkflows,
    enabled: canLoadWorkflows,
    retry: canLoadWorkflows ? 2 : false,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/workflows"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/config"] }),
      ]);
    } catch {
      setShowConfigForm(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (configState && !configState.configured) {
      setShowConfigForm(true);
    }
  }, [configState]);

  useEffect(() => {
    if (isError && error instanceof Error && error.message.includes("not configured")) {
      setShowConfigForm(true);
    }
  }, [error, isError]);

  const handleConfigSuccess = () => {
    setShowConfigForm(false);
    void handleRefresh();
  };

  const handleWorkflowStatusChange = (id: string, active: boolean) => {
    queryClient.setQueryData<Workflow[]>(["/api/workflows"], (oldData) => {
      if (!oldData) {
        return [];
      }

      return oldData.map((workflow) =>
        workflow.id === id ? { ...workflow, active } : workflow
      );
    });
  };

  const sortedWorkflows = React.useMemo(() => {
    if (!workflows) return [];

    return [...workflows].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date-asc":
          return new Date(a.updatedAt || a.createdAt || 0).getTime() -
            new Date(b.updatedAt || b.createdAt || 0).getTime();
        case "date-desc":
          return new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime();
        case "status":
          return Number(b.active) - Number(a.active);
        default:
          return 0;
      }
    });
  }, [sortBy, workflows]);

  const activeCount = workflows?.filter((workflow) => workflow.active).length ?? 0;
  const totalCount = workflows?.length ?? 0;
  const inactiveCount = totalCount - activeCount;
  const isConfigured = canLoadWorkflows;
  const isConnected = isConfigured && !isError;
  const isEmpty = canLoadWorkflows && !isLoading && !isError && (!workflows || workflows.length === 0);

  const renderContent = () => {
    switch (viewMode) {
      case "executions":
        return <Executions onBack={() => setViewMode("workflows")} />;
      case "backups":
        return <Backups onBack={() => setViewMode("workflows")} />;
      default:
        return renderWorkflowsView();
    }
  };

  const renderWorkflowsView = () => (
    <div className="screen-shell">
      <main className="screen-frame space-y-6">
        <header className="surface-panel flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-[1.4rem] border border-[hsl(var(--border))] bg-white/85 p-3 shadow-[0_18px_32px_-26px_rgba(15,23,42,0.55)]">
                <AchtletLogo size={38} />
              </div>
              <div>
                <p className="eyebrow">Achtlet</p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[hsl(var(--text-dark))] sm:text-3xl">
                  Android-ready n8n pocket console
                </h1>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  Install it as a PWA, keep the controls readable, and manage workflows
                  from a phone without shipping a separate native app.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="rounded-2xl border-[hsl(var(--border))]"
                onClick={() => setViewMode("executions")}
              >
                <Activity className="mr-2 h-4 w-4" />
                Executions
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-[hsl(var(--border))]"
                onClick={() => setViewMode("backups")}
              >
                <Archive className="mr-2 h-4 w-4" />
                Backups
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-[hsl(var(--border))]"
                onClick={onLogout}
              >
                Logout
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="surface-panel-strong min-h-[260px] p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`status-pill ${isConnected ? "bg-[hsl(var(--success-green))]/12 text-[hsl(var(--success-green))]" : "bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]"}`}>
                  {isConnected ? "Connected" : isConfigured ? "Needs attention" : "Configuration required"}
                </span>
                <span className="status-pill bg-[hsl(var(--accent))] text-[hsl(var(--highlight-color))]">
                  <Smartphone className="mr-1 h-3.5 w-3.5" />
                  Android PWA
                </span>
                <span className="status-pill bg-white/70 text-[hsl(var(--muted-foreground))]">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Session protected
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight text-[hsl(var(--text-dark))]">
                {isConnected
                  ? "Ready to manage workflows from your phone."
                  : "Point Achtlet at your n8n instance to unlock the control surface."}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                {configState?.url
                  ? `Current target: ${configState.url}`
                  : "Save a server-side connection and install the app on Android for the fastest daily workflow."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="rounded-2xl border-[hsl(var(--border))]"
                  onClick={() => setShowConfigForm((value) => !value)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {showConfigForm ? "Hide config" : "Configure connection"}
                </Button>
                <Button
                  className="rounded-2xl border-b-4 border-b-[hsl(var(--highlight-color))]"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh now"}
                </Button>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <article className="metric-card">
                <p className="metric-label">Total workflows</p>
                <p className="metric-value">{totalCount}</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Active</p>
                <p className="metric-value">{activeCount}</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Paused</p>
                <p className="metric-value">{inactiveCount}</p>
              </article>
            </section>
          </div>
        </header>

        <InstallPWA />

        {showConfigForm && (
          <N8nConfigForm onSuccess={handleConfigSuccess} />
        )}

        {!isLoading && !isError && workflows && workflows.length > 0 && (
          <section className="surface-panel p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Workflow list</p>
                <h3 className="mt-2 text-lg font-bold text-[hsl(var(--text-dark))]">
                  Sort and toggle your automations
                </h3>
              </div>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="h-11 w-[220px] rounded-2xl border-[hsl(var(--border))] bg-white text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">
                    <div className="flex items-center">
                      <ArrowDownAZ className="mr-2 h-3.5 w-3.5" />
                      Name A-Z
                    </div>
                  </SelectItem>
                  <SelectItem value="name-desc">
                    <div className="flex items-center">
                      <ArrowUpAZ className="mr-2 h-3.5 w-3.5" />
                      Name Z-A
                    </div>
                  </SelectItem>
                  <SelectItem value="date-asc">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-3.5 w-3.5" />
                      Oldest updated
                    </div>
                  </SelectItem>
                  <SelectItem value="date-desc">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-3.5 w-3.5" />
                      Newest updated
                    </div>
                  </SelectItem>
                  <SelectItem value="status">
                    <div className="flex items-center">
                      <Power className="mr-2 h-3.5 w-3.5" />
                      Active first
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
        )}

        <section className="surface-panel p-4 sm:p-5">
          {canLoadWorkflows && isLoading && (
            <div className="py-14 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-[3px] border-[hsl(var(--border))] border-t-[hsl(var(--primary))]" />
              <p className="text-sm font-semibold text-[hsl(var(--text-dark))]">
                Loading workflows
              </p>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Large n8n instances can take a moment.
              </p>
            </div>
          )}

          {canLoadWorkflows && isError && (
            <div className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]">
                <AlertCircle className="h-8 w-8" />
              </div>
              <p className="text-lg font-bold text-[hsl(var(--text-dark))]">
                Unable to load workflows
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                {error instanceof Error ? error.message : "Connection failed. Please check your n8n connection."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfigForm(true)}
                  className="rounded-2xl border-[hsl(var(--border))]"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Connection
                </Button>
                <Button
                  onClick={handleRefresh}
                  className="rounded-2xl border-b-4 border-b-[hsl(var(--highlight-color))]"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {isEmpty && (
            <div className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]">
                <FileText className="h-8 w-8" />
              </div>
              <p className="text-lg font-bold text-[hsl(var(--text-dark))]">
                No workflows found
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Create workflows in n8n and come back here to switch, sort, and review
                them from Android.
              </p>
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="mt-4 rounded-2xl border-[hsl(var(--border))]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh List
              </Button>
            </div>
          )}

          {!isConfigLoading && !canLoadWorkflows && (
            <div className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--highlight-color))]">
                <Settings className="h-8 w-8" />
              </div>
              <p className="text-lg font-bold text-[hsl(var(--text-dark))]">
                Connection setup is waiting above
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Save your n8n URL and API key to load workflows, executions, and backups.
              </p>
            </div>
          )}

          {canLoadWorkflows && !isLoading && !isError && workflows && workflows.length > 0 && (
            <div className="space-y-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  {workflows.length} workflows loaded
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  {activeCount} active / {workflows.length} total
                </span>
              </div>

              {sortedWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  id={workflow.id}
                  name={workflow.name}
                  description={workflow.description}
                  active={workflow.active}
                  createdAt={workflow.createdAt}
                  updatedAt={workflow.updatedAt}
                  onStatusChange={handleWorkflowStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );

  return renderContent();
};

export default Dashboard;
