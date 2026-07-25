import { request } from "./client";
import type { AuthUser, Job, Me } from "./types";

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

  getMe: () => request<Me>("/users/me"),
};
