// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { toProxyErrorStatus } from './upstreamStatus.js';

describe('toProxyErrorStatus', () => {
  it('preserves common contentful error statuses', () => {
    expect(toProxyErrorStatus(401)).toBe(401);
    expect(toProxyErrorStatus(429)).toBe(429);
    expect(toProxyErrorStatus(503)).toBe(503);
  });

  it('normalizes unofficial and non-error upstream statuses', () => {
    expect(toProxyErrorStatus(418)).toBe(400);
    expect(toProxyErrorStatus(204)).toBe(502);
    expect(toProxyErrorStatus(599)).toBe(502);
  });
});
