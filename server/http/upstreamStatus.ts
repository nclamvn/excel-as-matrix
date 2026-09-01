export type ProxyErrorStatus =
  | 400
  | 401
  | 403
  | 404
  | 408
  | 409
  | 413
  | 422
  | 429
  | 500
  | 502
  | 503
  | 504;

const PASSTHROUGH_STATUSES = new Set<ProxyErrorStatus>([
  400, 401, 403, 404, 408, 409, 413, 422, 429, 500, 502, 503, 504,
]);

/** Keep common upstream failures, collapse unusual/unofficial codes to a safe gateway error. */
export function toProxyErrorStatus(status: number): ProxyErrorStatus {
  if (PASSTHROUGH_STATUSES.has(status as ProxyErrorStatus)) {
    return status as ProxyErrorStatus;
  }
  if (status >= 400 && status < 500) return 400;
  return 502;
}
