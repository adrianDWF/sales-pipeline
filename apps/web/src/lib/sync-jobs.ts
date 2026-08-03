import { apiFetch } from "@/lib/api";

export type SyncJobResponse = {
  status: string;
  error_code?: string | null;
  error_message?: string | null;
  progress_message?: string | null;
  attempts?: number | null;
};

export type SyncJobDiagnostic = SyncJobResponse & {
  jobId: string;
  pollingError?: string;
};

export type SyncJobsSummary = {
  succeeded: number;
  failed: number;
  pending: number;
  diagnostics: SyncJobDiagnostic[];
  errorMessage?: string;
};

function summarizeSyncJobs(
  diagnostics: SyncJobDiagnostic[],
): SyncJobsSummary {
  const succeeded = diagnostics.filter(
    (job) => job.status === "success" || job.status === "completed",
  ).length;
  const pending = diagnostics.filter(
    (job) =>
      job.status === "queued" ||
      job.status === "retrying" ||
      job.status === "running",
  ).length;
  const failed = diagnostics.length - succeeded - pending;
  const firstIssue = diagnostics.find(
    (job) =>
      job.status !== "success" &&
      job.status !== "completed" &&
      job.status !== "queued" &&
      job.status !== "running",
  );

  return {
    succeeded,
    failed,
    pending,
    diagnostics,
    errorMessage: firstIssue ? describeDiagnostic(firstIssue) : undefined,
  };
}

function describeDiagnostic(diagnostic: SyncJobDiagnostic): string {
  const shortJobId = diagnostic.jobId.slice(0, 8);

  if (diagnostic.pollingError) {
    return `Sync job ${shortJobId} could not be checked: ${diagnostic.pollingError}`;
  }

  if (diagnostic.status === "queued" || diagnostic.status === "retrying") {
    const attempts =
      typeof diagnostic.attempts === "number"
        ? ` (attempts: ${diagnostic.attempts})`
        : "";
    return `Sync job ${shortJobId} is still ${diagnostic.status}${attempts}. The background worker has not completed it.`;
  }

  if (diagnostic.status === "running") {
    return `Sync job ${shortJobId} is still running${
      diagnostic.progress_message ? `: ${diagnostic.progress_message}` : "."
    }`;
  }

  const providerError =
    diagnostic.error_message ??
    diagnostic.progress_message ??
    diagnostic.error_code;

  return providerError
    ? `Sync job ${shortJobId} failed: ${providerError}`
    : `Sync job ${shortJobId} ended with status "${diagnostic.status}".`;
}

export async function pollSyncJob(
  jobId: string,
  token: string,
  options: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<SyncJobResponse> {
  const intervalMs = options.intervalMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 120_000;
  const started = Date.now();
  let lastJob: SyncJobResponse | null = null;

  while (Date.now() - started < timeoutMs) {
    const { job } = await apiFetch<{ job: SyncJobResponse }>(`/sync/jobs/${jobId}`, {
      token,
    });
    lastJob = job;

    if (
      job.status === "success" ||
      job.status === "completed" ||
      job.status === "failed" ||
      job.status === "cancelled"
    ) {
      return job;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return lastJob ?? {
    status: "unknown",
    error_message: "The sync job returned no status before polling timed out.",
  };
}

export async function pollSyncJobs(
  jobIds: string[],
  token: string,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    onProgress?: (summary: SyncJobsSummary) => void;
  } = {},
): Promise<SyncJobsSummary> {
  if (jobIds.length === 0) {
    return { succeeded: 0, failed: 0, pending: 0, diagnostics: [] };
  }

  const intervalMs = options.intervalMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 120_000;
  const started = Date.now();
  let latest = summarizeSyncJobs(
    jobIds.map((jobId) => ({ jobId, status: "queued" })),
  );

  while (Date.now() - started < timeoutMs) {
    const diagnostics = await Promise.all(
      jobIds.map(async (jobId): Promise<SyncJobDiagnostic> => {
        try {
          const { job } = await apiFetch<{ job: SyncJobResponse }>(
            `/sync/jobs/${jobId}`,
            { token },
          );
          return { jobId, ...job };
        } catch (error) {
          return {
            jobId,
            status: "poll_error",
            pollingError:
              error instanceof Error ? error.message : "Unknown polling error",
          };
        }
      }),
    );

    latest = summarizeSyncJobs(diagnostics);
    options.onProgress?.(latest);

    if (latest.pending === 0) return latest;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return latest;
}
