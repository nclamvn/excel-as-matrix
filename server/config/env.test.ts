// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { readServerConfig } from './env.js';

describe('readServerConfig', () => {
  it('uses safe development defaults and leaves optional features disabled', () => {
    const config = readServerConfig({});
    expect(config).toMatchObject({
      environment: 'development',
      port: 3001,
      corsOrigins: ['http://localhost:5173', 'http://localhost:5174'],
      anthropicApiKey: '',
      stripeSecretKey: '',
      scimBearerToken: '',
    });
  });

  it.each(['0', '65536', '3.14', 'not-a-port'])('rejects invalid PORT=%s', (port) => {
    expect(() => readServerConfig({ PORT: port })).toThrow('PORT must be an integer');
  });

  it('requires explicit CORS origins in production', () => {
    expect(() => readServerConfig({ NODE_ENV: 'production' })).toThrow(
      'CORS_ORIGINS is required in production'
    );
  });

  it('rejects wildcard credentialed CORS', () => {
    expect(() => readServerConfig({ CORS_ORIGINS: '*' })).toThrow(
      'CORS_ORIGINS cannot contain "*"'
    );
  });

  it('parses, validates and deduplicates configured origins', () => {
    const config = readServerConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      CORS_ORIGINS: 'https://app.example.com, https://admin.example.com,https://app.example.com',
    });
    expect(config.port).toBe(8080);
    expect(config.corsOrigins).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });
});
