import { ACCESS_TOKEN, getCookie } from "./cookies";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie(ACCESS_TOKEN)}`,
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

  verifyEmail: (token: string) =>
    request<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  requestPasswordReset: (email: string) =>
    request<{ message: string }>("/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
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
