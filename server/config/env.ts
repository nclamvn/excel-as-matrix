export type ServerEnvironment = 'development' | 'test' | 'production';

export interface ServerConfig {
  environment: ServerEnvironment;
  port: number;
  corsOrigins: string[];
  anthropicApiKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  scimBearerToken: string;
}

const DEVELOPMENT_ORIGINS = ['http://localhost:5173', 'http://localhost:5174'];
const VALID_ENVIRONMENTS = new Set<ServerEnvironment>(['development', 'test', 'production']);

function parseEnvironment(raw: string | undefined): ServerEnvironment {
  const value = raw?.trim() || 'development';
  if (!VALID_ENVIRONMENTS.has(value as ServerEnvironment)) {
    throw new Error(`NODE_ENV must be development, test, or production; received "${value}"`);
  }
  return value as ServerEnvironment;
}

function parsePort(raw: string | undefined): number {
  const value = raw?.trim() || '3001';
  if (!/^\d+$/.test(value)) {
    throw new Error(`PORT must be an integer from 1 to 65535; received "${value}"`);
  }

  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`PORT must be an integer from 1 to 65535; received "${value}"`);
  }
  return port;
}

function parseCorsOrigins(raw: string | undefined, environment: ServerEnvironment): string[] {
  const origins = raw
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if ((!origins || origins.length === 0) && environment === 'production') {
    throw new Error('CORS_ORIGINS is required in production');
  }

  const resolved = origins && origins.length > 0 ? [...new Set(origins)] : DEVELOPMENT_ORIGINS;
  if (resolved.includes('*')) {
    throw new Error('CORS_ORIGINS cannot contain "*" because credentialed CORS is enabled');
  }

  for (const origin of resolved) {
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      throw new Error(`CORS_ORIGINS contains an invalid origin: "${origin}"`);
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new Error(`CORS_ORIGINS must contain HTTP(S) origins without paths: "${origin}"`);
    }
  }

  return resolved;
}

function optionalSecret(value: string | undefined): string {
  return value?.trim() || '';
}

export function readServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const environment = parseEnvironment(env.NODE_ENV);
  return {
    environment,
    port: parsePort(env.PORT),
    corsOrigins: parseCorsOrigins(env.CORS_ORIGINS, environment),
    anthropicApiKey: optionalSecret(env.ANTHROPIC_API_KEY),
    stripeSecretKey: optionalSecret(env.STRIPE_SECRET_KEY),
    stripeWebhookSecret: optionalSecret(env.STRIPE_WEBHOOK_SECRET),
    scimBearerToken: optionalSecret(env.SCIM_BEARER_TOKEN),
  };
}

export const serverConfig = readServerConfig();
