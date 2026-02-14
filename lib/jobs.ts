
export type JobStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface Job {
  id: string;
  url: string;
  status: JobStatus;
  progress: number;
  outputFile?: string;
  error?: string;
}

// Persist jobs across hot reloads in development
const globalForJobs = global as unknown as { jobs: Map<string, Job> };

export const jobs = globalForJobs.jobs || new Map<string, Job>();

if (process.env.NODE_ENV !== 'production') {
  globalForJobs.jobs = jobs;
}
