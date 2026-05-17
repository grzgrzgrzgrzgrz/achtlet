import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  Archive,
  Calendar,
  HardDrive,
  Database,
} from "lucide-react";
import type { Backup } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface BackupsProps {
  onBack: () => void;
}

const Backups: React.FC<BackupsProps> = ({ onBack }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { data: backups, isLoading, refetch } = useQuery<Backup[]>({
    queryKey: ["/api/backups"],
    queryFn: async () => {
      const response = await fetch("/api/backups", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch backups");
      }

      return response.json();
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/backups", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create backup");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      toast({
        title: "Backup created",
        description: "A fresh archive is ready for download.",
      });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const response = await fetch(`/api/backups/${backupId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete backup");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      toast({
        title: "Backup deleted",
        description: "The archive was removed from the server.",
      });
    },
  });

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      await createBackupMutation.mutateAsync();
    } catch (error) {
      toast({
        title: "Backup failed",
        description: error instanceof Error ? error.message : "Could not create a backup.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadBackup = (backupId: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `/api/backups/${backupId}/download`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (window.confirm("Are you sure you want to delete this backup? This action cannot be undone.")) {
      try {
        await deleteBackupMutation.mutateAsync(backupId);
      } catch (error) {
        toast({
          title: "Delete failed",
          description: error instanceof Error ? error.message : "Could not delete the backup.",
          variant: "destructive",
        });
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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
              <h1 className="text-xl font-bold text-[hsl(var(--text-dark))] flex items-center">
                <Archive className="mr-2 h-6 w-6" />
                Backups
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
                className="rounded-2xl border-[hsl(var(--border))]"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Button
                onClick={handleCreateBackup}
                disabled={isCreating || createBackupMutation.isPending}
                className="rounded-2xl border-b-4 border-b-[hsl(var(--highlight-color))]"
              >
                {isCreating || createBackupMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Backup
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <Card className="surface-panel-strong border-0 shadow-none">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Archive className="mt-0.5 h-5 w-5 text-[hsl(var(--primary))]" />
                  <div>
                    <p className="eyebrow">Archive policy</p>
                    <h2 className="mt-3 text-lg font-bold text-[hsl(var(--text-dark))]">
                      Nightly snapshots plus manual archives
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                      Achtlet keeps a rolling backup set and lets you trigger a fresh export before
                      risky changes or maintenance windows.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <article className="metric-card">
              <p className="metric-label">Archives on server</p>
              <p className="metric-value">{backups?.length ?? 0}</p>
            </article>
          </div>
        </header>

        <section className="surface-panel p-4 sm:p-5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[hsl(var(--border))] border-t-[hsl(var(--primary))] mb-4"></div>
              <p className="text-[hsl(var(--muted-foreground))]">Loading backups...</p>
            </div>
          ) : !backups || backups.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Archive className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
              <p className="text-lg font-medium text-[hsl(var(--text-dark))]">No backups found</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Create your first backup to get started</p>
              <Button onClick={handleCreateBackup} disabled={isCreating} className="rounded-2xl">
                <Plus className="h-4 w-4 mr-2" />
                Create First Backup
              </Button>
            </div>
          ) : (
            <div className="p-1">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  {backups.length} archive{backups.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  Total size {formatFileSize(backups.reduce((sum, backup) => sum + backup.size, 0))}
                </span>
              </div>

              <div className="space-y-3">
                {backups.map((backup) => (
                  <Card key={backup.id} className="surface-panel border-0 shadow-none">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2 text-[hsl(var(--text-dark))]">
                            <Archive className="h-5 w-5 text-[hsl(var(--primary))]" />
                            {backup.filename}
                          </CardTitle>
                          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                            Created {format(new Date(backup.createdAt), "MMM dd, yyyy 'at' HH:mm:ss")}
                          </p>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1 border-[hsl(var(--border))] bg-white/70">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(backup.size)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          <span className="font-medium text-[hsl(var(--muted-foreground))]">Workflows</span>
                          <span>{backup.workflowCount === -1 ? "See ZIP" : backup.workflowCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          <span className="font-medium text-[hsl(var(--muted-foreground))]">Executions</span>
                          <span>{backup.executionCount === -1 ? "See ZIP" : backup.executionCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Archive className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          <span className="font-medium text-[hsl(var(--muted-foreground))]">ID</span>
                          <span className="font-mono text-xs">{backup.id.slice(0, 8)}...</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDownloadBackup(backup.id, backup.filename)}
                          className="flex items-center gap-1 rounded-2xl"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteBackup(backup.id)}
                          disabled={deleteBackupMutation.isPending}
                          className="flex items-center gap-1 rounded-2xl"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Backups;
