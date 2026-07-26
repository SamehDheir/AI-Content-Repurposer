export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ContentType =
  | "TWITTER_THREAD"
  | "BLOG_POST"
  | "FACEBOOK_POST"
  | "HIGHLIGHTS";

export interface AuthUser {
  id: string;
  email: string;
}

export interface Me {
  id: string;
  email: string;
  name: string | null;
  plan: "FREE" | "PRO";
  createdAt: string;
  usage: {
    used: number;
    limit: number | null;
    remaining: number | null;
    resetsAt: string;
  };
}

export interface GeneratedContent {
  type: ContentType;
  body: string;
}

/**
 * What the ledger and the status stream return. The generated prose is *not*
 * included — a list of twenty jobs would otherwise ship every word of eighty
 * pieces to draw a row of format dots. Open a sheet and `getJob` fetches the
 * bodies for that one job.
 */
export interface JobSummary {
  id: string;
  videoUrl: string;
  status: JobStatus;
  language: string;
  createdAt: string;
  imageUrl?: string;
  generatedContent: { type: ContentType }[];
}

/** One job with its content — `GET /jobs/:id` only. */
export interface Job extends Omit<JobSummary, "generatedContent"> {
  generatedContent: GeneratedContent[];
}
