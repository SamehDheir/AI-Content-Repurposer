const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function getToken() {
  if (typeof window === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; accessToken=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? "";
  return "";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Request failed");
  }

  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name?: string) =>
    request<{ accessToken: string; refreshToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  createJob: (videoUrl: string, language: "Arabic" | "English") =>
    request<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify({ videoUrl, language }),
    }),

  getMyJobs: () => request<Job[]>("/jobs"),
  getJob: (id: string) => request<Job>(`/jobs/${id}`),

  generateImageForJob: (jobId: string) =>
    request<{ imageUrl: string }>(`/jobs/${jobId}/generate-image`, {
      method: "POST",
    }),

  getMe: () => request<any>("/users/me"),
};

// ── Types ──────────────────────────────────────────────────
export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ContentType =
  | "TWITTER_THREAD"
  | "BLOG_POST"
  | "FACEBOOK_POST"
  | "HIGHLIGHTS";

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
