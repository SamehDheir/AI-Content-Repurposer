import { request } from "./client";
import type { AuthUser, Job, JobSummary, Me } from "./types";

export const api = {
  login: (email: string, password: string) =>
    request<AuthUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name?: string) =>
    request<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),

  verifyEmail: (token: string) =>
    request<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  resendVerification: (email: string) =>
    request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
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

  // A freshly queued job has no content yet, so this response carries the row
  // on its own — no `generatedContent` key at all.
  createJob: (videoUrl: string, language: "Arabic" | "English") =>
    request<Omit<JobSummary, "generatedContent">>("/jobs", {
      method: "POST",
      body: JSON.stringify({ videoUrl, language }),
    }),

  getMyJobs: () => request<JobSummary[]>("/jobs"),
  /** The only call that carries the generated bodies. */
  getJob: (id: string) => request<Job>(`/jobs/${id}`),

  generateImageForJob: (jobId: string) =>
    request<{ imageUrl: string }>(`/jobs/${jobId}/generate-image`, {
      method: "POST",
    }),

  getMe: () => request<Me>("/users/me"),

  /**
   * "Is anyone signed in?", asked once by the marketing page to decide what the
   * call to action says. For a signed-out visitor the 401 *is* the answer, so
   * this skips the refresh-and-replay: retrying made every anonymous homepage
   * load wait on two round-trips (401 here, then 401 on /auth/refresh) before
   * it could finish rendering its own button.
   */
  probeSession: () => request<Me>("/users/me", { noRetry: true }),
};
