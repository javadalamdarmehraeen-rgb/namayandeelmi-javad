/**
 * ============================================================
 *  Retry  Exponential Backoff + Jitter
 * ------------------------------------------------------------
 *           
 *  Neon (cold start)     .
 *
 *  :
 *   -   «»   (  5xx 429).
 *   -   (unique violation 4xx syntax)   
 *          .
 *   -    Jitter    « »  .
 * ============================================================
 */
export type RetryOptions = {
  /**    (  ) */
  retries?: number;
  /**      */
  baseDelayMs?: number;
  /**     */
  maxDelayMs?: number;
  /**        */
  timeoutMs?: number;
  /**    */
  label?: string;
  /**      */
  isRetryable?: (error: unknown) => boolean;
  /**      */
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
  signal?: AbortSignal;
};
const DEFAULTS: Required<Omit<RetryOptions, "isRetryable" | "onRetry" | "signal" | "label">> = {
  retries: 4,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  timeoutMs: 20_000,
};
/**         */
export const TRANSIENT_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EPIPE",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENETDOWN",
  "EAI_AGAIN",
  "ENOTFOUND",
  "EADDRNOTAVAIL",
  "ECONNABORTED",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_SOCKET",
]);
/**
 *   PostgreSQL ( 08 =  53 =  
 * 57P = /  40001/40P01 =  )
 */
export const TRANSIENT_PG_CODES = new Set([
  "08000", "08001", "08003", "08004", "08006", "08007", "08P01",
  "53300", "53400", "57P01", "57P02", "57P03",
  "40001", "40P01",
  "XX000", // internal error —  Neon     
]);
const TRANSIENT_MESSAGE_HINTS = [
  "timeout",
  "timed out",
  "connection terminated",
  "connection closed",
  "connection reset",
  "socket hang up",
  "server closed the connection",
  "terminating connection",
  "too many connections",
  "fetch failed",
  "network",
  "temporarily unavailable",

  "endpoint is disabled", //  Neon    
  "compute time exceeded",
  "could not connect",
];
function errCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const e = error as { code?: unknown; errno?: unknown; cause?: unknown };
  if (typeof e.code === "string") return e.code;
  if (typeof e.errno === "string") return e.errno;
  if (e.cause) return errCode(e.cause);
  return "";
}
function errMessage(error: unknown): string {
  if (error instanceof Error) return `${error.message} ${errMessage((error as Error & { cause?: unknown }).cause ?? "")}
`;
  if (typeof error === "string") return error;
  return "";
}
/**          */
export function isTransientError(error: unknown): boolean {
  if (!error) return false;
  //     
  if (error instanceof Error && error.name === "AbortError") return false;
  const code = errCode(error).toUpperCase();
  if (TRANSIENT_NETWORK_CODES.has(code)) return true;
  if (TRANSIENT_PG_CODES.has(errCode(error))) return true;
  //  HTTP:  5xx  429  408
  const status = (error as { status?: number; statusCode?: number })?.status ??
    (error as { statusCode?: number })?.statusCode;
  if (typeof status === "number") {
    if (status >= 500 || status === 429 || status === 408) return true;
    return false;
  }
  const msg = errMessage(error).toLowerCase();
  return TRANSIENT_MESSAGE_HINTS.some((h) => msg.includes(h));
}
/**    Jitter  (Full Jitter) */
export function backoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
  // Full Jitter:         
  const half = exponential / 2;
  return Math.round(half + Math.random() * half);
}
const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number, outer?: AbortSignal): Promise<T> {
  if (!ms) return fn(outer ?? new AbortController().signal);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException("Timeout", "TimeoutError")), ms);
  outer?.addEventListener("abort", () => ctrl.abort(), { once: true });
  return fn(ctrl.signal).finally(() => clearTimeout(timer));
}
/**
 *       .
 *
 * @example
 * const rows = await withRetry(() => db.select().from(users), { label: "users:list" });
 */
export async function withRetry<T>(
  operation: (attempt: number, signal: AbortSignal) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const cfg = { ...DEFAULTS, ...options };
  const retryable = options.isRetryable ?? isTransientError;

  let lastError: unknown;
  for (let attempt = 1; attempt <= cfg.retries; attempt++) {
    try {
      return await withTimeout((signal) => operation(attempt, signal), cfg.timeoutMs, options.signal);
    } catch (error) {
      lastError = error;
      const isLast = attempt >= cfg.retries;
      // TimeoutError     
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      if (isLast || !(timedOut || retryable(error))) throw error;
      const delayMs = backoffDelay(attempt, cfg.baseDelayMs, cfg.maxDelayMs);
      options.onRetry?.({ attempt, delayMs, error });
      console.warn(
        `[retry${options.label ? `:${options.label}` : ""}]  ${attempt}/${cfg.retries}  ` +
          `(${errCode(error) || errMessage(error).slice(0, 80)}) —    ${delayMs}ms `,
      );
      await sleep(delayMs, options.signal);
    }
  }
  throw lastError;
}
/**  :        */
export async function withRetrySafe<T>(
  operation: (attempt: number, signal: AbortSignal) => Promise<T>,
  fallback: T,
  options: RetryOptions = {},
): Promise<T> {
  try {
    return await withRetry(operation, options);
  } catch (error) {
    console.error(`[retry${options.label ? `:${options.label}` : ""}]  :`, errMessage(error).slice(0, 200));
    return fallback;
  }
}
/** fetch     (  ) */
export async function fetchWithRetry(
  input: string | URL,
  init: RequestInit = {},
  options: RetryOptions = {},
): Promise<Response> {
  return withRetry(
    async (_attempt, signal) => {
      const res = await fetch(input, { ...init, signal: init.signal ?? signal, cache: init.cache ?? "no-store" });
      // 5xx / 429 / 408        Retry  
      if (res.status >= 500 || res.status === 429 || res.status === 408) {
        const err = new Error(`HTTP ${res.status}  ${typeof input === "string" ? input : input.toString()}`);
        (err as Error & { status: number }).status = res.status;
        throw err;
      }
      return res;
    },
    { retries: 3, baseDelayMs: 800, maxDelayMs: 8_000, timeoutMs: 15_000, ...options },
  );
}
