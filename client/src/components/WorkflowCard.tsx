import React, { useState } from "react";
import { cn } from "@/lib/utils";
import StatusIndicator from "./StatusIndicator";
import { toggleWorkflow } from "../lib/api";
import { useToast } from "@/hooks/use-toast";

interface WorkflowCardProps {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  onStatusChange: (id: string, active: boolean) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  id,
  name,
  description,
  active,
  createdAt,
  updatedAt,
  onStatusChange,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = e.target.checked;
    setIsUpdating(true);

    try {
      await toggleWorkflow(id, newStatus);
      onStatusChange(id, newStatus);
      toast({
        title: newStatus ? "Workflow activated" : "Workflow deactivated",
        description: `${name} has been ${newStatus ? "activated" : "deactivated"} successfully.`,
        variant: "default",
      });
    } catch {
      toast({
        title: "Failed to update workflow",
        description: `There was an error updating ${name}. Please try again.`,
        variant: "destructive",
      });
      e.target.checked = active;
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedUpdated = updatedAt ? new Date(updatedAt).toLocaleDateString() : "";
  const formattedCreated = createdAt ? new Date(createdAt).toLocaleDateString() : "";

  return (
    <div
      className={cn(
        "surface-panel fade-in mb-3 overflow-hidden border-l-[5px] p-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-32px_rgba(15,23,42,0.45)]",
        active ? "border-l-[hsl(var(--success-green))]" : "border-l-[hsl(var(--inactive-color))]"
      )}
    >
      <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1 pr-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusIndicator active={active} size="sm" className="mr-1" />
            <h3 className="truncate text-base font-bold text-[hsl(var(--text-dark))]">
              {name}
            </h3>
            <span
              className={cn(
                "status-pill",
                active
                  ? "bg-[hsl(var(--success-green))]/12 text-[hsl(var(--success-green))]"
                  : "bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"
              )}
            >
              {active ? "Live" : "Paused"}
            </span>
          </div>

          {description && (
            <p className="line-clamp-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              {description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
            {formattedCreated && <span>Created {formattedCreated}</span>}
            {formattedUpdated && <span>Updated {formattedUpdated}</span>}
          </div>
        </div>

        <div className="flex items-center pt-1">
          <div className="relative">
            <span className="sr-only">{active ? "Active" : "Inactive"}</span>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={active}
                onChange={handleToggle}
                disabled={isUpdating}
                aria-label={`Toggle ${name} workflow ${active ? "off" : "on"}`}
              />
              <span className="toggle-slider"></span>
            </label>

            {isUpdating && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/85">
                <svg
                  className="h-4 w-4 animate-spin text-[hsl(var(--highlight-color))]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-label="Loading"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCard;
