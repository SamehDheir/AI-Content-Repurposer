const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Endpoints that must not trigger a refresh-and-retry on 401. */
const NO_RETRY = ["/auth/login", "/auth/register", "/auth/refresh"];

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function toError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => ({}));
  // Nest returns a string for single errors and an array from the ValidationPipe.
  const message = Array.isArray(body?.message)
    ? body.message.join(", ")
    : (body?.message ?? "Request failed");
  return new ApiError(message, res.status);
}

function send(path: string, options?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...options,
    // Auth travels as HttpOnly cookies, which are only attached when the
    // request explicitly opts in to sending credentials cross-origin.
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

// A single in-flight refresh shared by every 401 that arrives at once, so a
// burst of parallel requests rotates the token once rather than racing.
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= send("/auth/refresh", { method: "POST" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  let res = await send(path, options);

  // The access token lives ~15 minutes; on expiry, refresh once and replay.
  if (res.status === 401 && !NO_RETRY.includes(path)) {
    if (await refreshSession()) {
      res = await send(path, options);
    }
  }

  if (!res.ok) throw await toError(res);

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
