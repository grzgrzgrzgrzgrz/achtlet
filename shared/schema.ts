export interface Workflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ExecutionStatus =
  | "success"
  | "error"
  | "running"
  | "waiting"
  | "canceled"
  | "crashed"
  | "new";

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName?: string;
  mode: string;
  status: ExecutionStatus;
  startedAt: string;
  stoppedAt?: string;
  duration?: number;
  retryOf?: string;
  retrySuccessId?: string;
  error?: string;
  data?: unknown;
}

export interface Backup {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  workflowCount: number;
  executionCount: number;
}

export interface N8nConfig {
  url: string;
  apiKey: string;
}

export interface N8nConfigState {
  url: string;
  configured: boolean;
  apiKeyConfigured: boolean;
  locked: boolean;
  source: "environment" | "file" | "unset";
}
