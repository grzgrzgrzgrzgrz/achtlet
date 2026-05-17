import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchExecutions, fetchWorkflows } from "@/lib/api";
import type { ExecutionStatus, WorkflowExecution, Workflow } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Filter,
  Calendar,
  Timer,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface ExecutionsProps {
  onBack: () => void;
}

type StatusFilter = "all" | ExecutionStatus;
type SortOption = "date-desc" | "date-asc" | "duration-desc" | "duration-asc" | "status";
type BadgeVariant = NonNullable<React.ComponentProps<typeof Badge>["variant"]>;

const statusVariantMap: Record<ExecutionStatus | "unknown", BadgeVariant> = {
  success: "default",
  error: "destructive",
  running: "secondary",
  waiting: "outline",
  canceled: "outline",
  crashed: "destructive",
  new: "outline",
  unknown: "outline",
};

const Executions: React.FC<ExecutionsProps> = ({ onBack }) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [workflowFilter, setWorkflowFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [limit, setLimit] = useState(50);
  const [activeTab, setActiveTab] = useState<string>("recent");

  const {
    data: executions,
    isLoading: isLoadingExecutions,
    isError: isExecutionsError,
    error: executionsError,
    refetch: refetchExecutions,
  } = useQuery<WorkflowExecution[]>({
    queryKey: ["/api/executions", {
      workflowId: workflowFilter === "all" ? undefined : workflowFilter,
      limit,
      status: statusFilter === "all" ? undefined : statusFilter,
    }],
    queryFn: () =>
      fetchExecutions({
        workflowId: workflowFilter === "all" ? undefined : workflowFilter,
        limit,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    retry: 2,
  });

  const { data: workflows } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
    queryFn: fetchWorkflows,
    retry: 2,
  });

  const handleRefresh = async () => {
    await refetchExecutions();
  };

  const sortedExecutions = React.useMemo(() => {
    if (!executions) return [];

    return [...executions].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        case "date-asc":
          return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
        case "duration-desc":
          return (b.duration || 0) - (a.duration || 0);
        case "duration-asc":
          return (a.duration || 0) - (b.duration || 0);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [executions, sortBy]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
      case "crashed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "running":
        return <Play className="h-4 w-4 text-blue-600" />;
      case "waiting":
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case "canceled":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          {getStatusIcon("unknown")}
          Unknown
        </Badge>
      );
    }

    return (
      <Badge variant={statusVariantMap[status as ExecutionStatus] || statusVariantMap.unknown} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "N/A";

    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }

    return `${seconds}s`;
  };

  const isLoading = isLoadingExecutions;
  const isError = isExecutionsError;

  const filteredExecutions = sortedExecutions.filter((execution) => {
    if (activeTab === "recent") return true;
    if (activeTab === "success") return execution.status === "success";
    if (activeTab === "failed") return execution.status === "error" || execution.status === "crashed";
    if (activeTab === "running") return execution.status === "running" || execution.status === "waiting";
    return true;
  });

  return (
    <div className="screen-shell">
      <div className="screen-frame space-y-6">
        <header className="surface-panel flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={onBack}
                className="mr-3 rounded-2xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Workflows
              </Button>
              <h1 className="flex items-center text-xl font-bold text-[hsl(var(--text-dark))]">
                <Activity className="mr-2 h-6 w-6" />
                Executions
              </h1>
            </div>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded-2xl border-[hsl(var(--border))]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <p className="eyebrow">Run history</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Filter recent runs by workflow, status, and duration without leaving the
                mobile surface.
              </p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Visible executions</p>
              <p className="metric-value">{filteredExecutions.length}</p>
            </div>
          </div>
        </header>

        <section className="surface-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-semibold text-[hsl(var(--text-dark))]">Filters</span>
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="h-11 w-[160px] rounded-2xl border-[hsl(var(--border))] bg-white text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
              <SelectTrigger className="h-11 w-[220px] rounded-2xl border-[hsl(var(--border))] bg-white text-sm">
                <SelectValue placeholder="Workflow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflows</SelectItem>
                {workflows?.map((workflow) => (
                  <SelectItem key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="h-11 w-[180px] rounded-2xl border-[hsl(var(--border))] bg-white text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-3 w-3" />
                    <span>Newest first</span>
                  </div>
                </SelectItem>
                <SelectItem value="date-asc">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-3 w-3" />
                    <span>Oldest first</span>
                  </div>
                </SelectItem>
                <SelectItem value="duration-desc">
                  <div className="flex items-center">
                    <Timer className="mr-2 h-3 w-3" />
                    <span>Longest duration</span>
                  </div>
                </SelectItem>
                <SelectItem value="duration-asc">
                  <div className="flex items-center">
                    <Timer className="mr-2 h-3 w-3" />
                    <span>Shortest duration</span>
                  </div>
                </SelectItem>
                <SelectItem value="status">
                  <div className="flex items-center">
                    <Activity className="mr-2 h-3 w-3" />
                    <span>Status</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={limit.toString()} onValueChange={(value) => setLimit(Number.parseInt(value, 10))}>
              <SelectTrigger className="h-11 w-[110px] rounded-2xl border-[hsl(var(--border))] bg-white text-sm">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl border border-[hsl(var(--border))] bg-white/70 p-1">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="success">Success</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
            <TabsTrigger value="running">Running</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="surface-panel py-14 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-[3px] border-[hsl(var(--border))] border-t-[hsl(var(--primary))]" />
                <p className="text-sm font-semibold text-[hsl(var(--text-dark))]">Loading executions</p>
              </div>
            ) : isError ? (
              <div className="surface-panel py-14 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <p className="text-lg font-bold text-[hsl(var(--text-dark))]">
                  Unable to load executions
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  {executionsError instanceof Error ? executionsError.message : "The execution feed could not be loaded."}
                </p>
              </div>
            ) : filteredExecutions.length === 0 ? (
              <div className="surface-panel py-14 text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-[hsl(var(--muted-foreground))]" />
                <p className="text-lg font-bold text-[hsl(var(--text-dark))]">No executions found</p>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Try a different filter or check back after the next run.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExecutions.map((execution) => (
                  <Card key={execution.id} className="surface-panel border-0 shadow-none">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <CardTitle className="text-lg text-[hsl(var(--text-dark))]">
                            {execution.workflowName || `Workflow ${execution.workflowId}`}
                          </CardTitle>
                          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                            ID: {execution.id}
                          </p>
                        </div>
                        {getStatusBadge(execution.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                        <div>
                          <p className="font-medium text-[hsl(var(--muted-foreground))]">Started</p>
                          <p>{format(new Date(execution.startedAt), "MMM dd, HH:mm:ss")}</p>
                        </div>
                        <div>
                          <p className="font-medium text-[hsl(var(--muted-foreground))]">Duration</p>
                          <p>{formatDuration(execution.duration)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-[hsl(var(--muted-foreground))]">Mode</p>
                          <p className="capitalize">{execution.mode}</p>
                        </div>
                        <div>
                          <p className="font-medium text-[hsl(var(--muted-foreground))]">Finished</p>
                          <p>
                            {execution.stoppedAt
                              ? format(new Date(execution.stoppedAt), "MMM dd, HH:mm:ss")
                              : "Still running"}
                          </p>
                        </div>
                      </div>

                      {execution.error && (
                        <div className="mt-4 rounded-2xl border border-[hsl(var(--destructive))]/20 bg-[hsl(var(--destructive))]/8 p-3">
                          <p className="text-sm font-medium text-[hsl(var(--destructive))]">Error</p>
                          <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{execution.error}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Executions;
