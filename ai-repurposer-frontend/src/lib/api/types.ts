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

export interface Job {
  id: string;
  videoUrl: string;
  status: JobStatus;
  language: string;
  createdAt: string;
  imageUrl?: string;
  generatedContent: GeneratedContent[];
}
