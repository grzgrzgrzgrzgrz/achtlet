import { apiRequest } from "@/lib/queryClient";
import type {
  N8nConfigState,
  Workflow,
  WorkflowExecution,
} from "@shared/schema";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchConfigState(): Promise<N8nConfigState> {
  const response = await fetch("/api/config", {
    credentials: "include",
  });

  return parseJson<N8nConfigState>(response);
}

export async function fetchWorkflows(): Promise<Workflow[]> {
  const response = await fetch("/api/workflows", {
    credentials: "include",
  });

  return parseJson<Workflow[]>(response);
}

export async function fetchExecutions(params?: {
  workflowId?: string;
  limit?: number;
  status?: string;
}): Promise<WorkflowExecution[]> {
  const queryParams = new URLSearchParams();
  if (params?.workflowId) queryParams.append("workflowId", params.workflowId);
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.status) queryParams.append("status", params.status);

  const response = await fetch(`/api/executions?${queryParams}`, {
    credentials: "include",
  });

  return parseJson<WorkflowExecution[]>(response);
}

export async function fetchExecutionDetails(id: string): Promise<WorkflowExecution> {
  const response = await fetch(`/api/executions/${id}`, {
    credentials: "include",
  });

  return parseJson<WorkflowExecution>(response);
}

export async function toggleWorkflow(id: string, active: boolean): Promise<Workflow> {
  const response = await apiRequest("PATCH", `/api/workflows/${id}`, { active });
  return response.json();
}

export async function checkN8nConnection(): Promise<{
  connected: boolean;
  configured: boolean;
  source: N8nConfigState["source"];
}> {
  const response = await fetch("/api/status", {
    credentials: "include",
  });

  return parseJson<{
    connected: boolean;
    configured: boolean;
    source: N8nConfigState["source"];
  }>(response);
}

export async function setN8nConfig(url: string, apiKey?: string): Promise<{
  success: boolean;
  config: N8nConfigState;
}> {
  const response = await apiRequest("POST", "/api/config", {
    url,
    apiKey: apiKey ?? "",
  });

  return response.json();
}
