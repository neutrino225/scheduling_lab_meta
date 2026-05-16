import { listJobs, countJobsByStatus } from "@/lib/jobs/service";
import { JobsContent } from "@/components/jobs-content";
import type { Job, JobSummary } from "@/lib/client/types";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const [jobsRows, summary] = await Promise.all([
    listJobs({ limit: 100 }),
    countJobsByStatus(),
  ]);

  const initialJobs = jobsRows as unknown as Job[];
  const initialSummary = summary as unknown as JobSummary;

  return <JobsContent initialJobs={initialJobs} initialSummary={initialSummary} />;
}
