// ═══════════════════════════════════════════════════════════════════════════
// SCIM 2.0 PROVISIONING — RFC 7644 compliant endpoints
// Supports Okta, Azure AD, OneLogin auto-provisioning
// ═══════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';

export const scimRouter = new Hono();

// ─────────────────────────────────────────────────────────────────────────────
// Types (SCIM 2.0 Core Schema)
// ─────────────────────────────────────────────────────────────────────────────

interface SCIMUser {
  schemas: string[];
  id: string;
  externalId?: string;
  userName: string;
  name: { givenName: string; familyName: string; formatted?: string };
  emails: Array<{ value: string; type: string; primary: boolean }>;
  active: boolean;
  displayName?: string;
  title?: string;
  groups?: Array<{ value: string; display: string }>;
  meta: { resourceType: string; created: string; lastModified: string; location: string };
}

interface SCIMGroup {
  schemas: string[];
  id: string;
  externalId?: string;
  displayName: string;
  members: Array<{ value: string; display: string }>;
  meta: { resourceType: string; created: string; lastModified: string; location: string };
}

interface SCIMListResponse<T> {
  schemas: string[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
}

// In-memory storage (production: use database)
const users = new Map<string, SCIMUser>();
const groups = new Map<string, SCIMGroup>();

const SCIM_SCHEMA_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
const SCIM_SCHEMA_GROUP = 'urn:ietf:params:scim:schemas:core:2.0:Group';
const SCIM_SCHEMA_LIST = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';

const SCIM_TOKEN = process.env.SCIM_BEARER_TOKEN || '';

// ─────────────────────────────────────────────────────────────────────────────
// Auth Middleware
// ─────────────────────────────────────────────────────────────────────────────

scimRouter.use('*', async (c, next) => {
  if (SCIM_TOKEN) {
    const auth = c.req.header('Authorization');
    if (!auth || auth !== `Bearer ${SCIM_TOKEN}`) {
      return c.json({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'Unauthorized',
        status: 401,
      }, 401);
    }
  }
  await next();
});

// ─────────────────────────────────────────────────────────────────────────────
// /Users endpoints
// ─────────────────────────────────────────────────────────────────────────────

// GET /scim/v2/Users — List users
scimRouter.get('/Users', (c) => {
  const filter = c.req.query('filter');
  const startIndex = parseInt(c.req.query('startIndex') || '1');
  const count = parseInt(c.req.query('count') || '100');

  let allUsers = Array.from(users.values());

  // Support basic filter: userName eq "value"
  if (filter) {
    const match = filter.match(/userName\s+eq\s+"([^"]+)"/i);
    if (match) {
      allUsers = allUsers.filter((u) => u.userName === match[1]);
    }
  }

  const paged = allUsers.slice(startIndex - 1, startIndex - 1 + count);

  const response: SCIMListResponse<SCIMUser> = {
    schemas: [SCIM_SCHEMA_LIST],
    totalResults: allUsers.length,
    startIndex,
    itemsPerPage: paged.length,
    Resources: paged,
  };

  return c.json(response);
});

// GET /scim/v2/Users/:id — Get user
scimRouter.get('/Users/:id', (c) => {
  const user = users.get(c.req.param('id'));
  if (!user) {
    return c.json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'User not found', status: 404 }, 404);
  }
  return c.json(user);
});

// POST /scim/v2/Users — Create user
scimRouter.post('/Users', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const user: SCIMUser = {
    schemas: [SCIM_SCHEMA_USER],
    id,
    externalId: body.externalId,
    userName: body.userName,
    name: body.name || { givenName: '', familyName: '' },
    emails: body.emails || [],
    active: body.active !== false,
    displayName: body.displayName || `${body.name?.givenName || ''} ${body.name?.familyName || ''}`.trim(),
    title: body.title,
    meta: {
      resourceType: 'User',
      created: now,
      lastModified: now,
      location: `/scim/v2/Users/${id}`,
    },
  };

  users.set(id, user);
  console.log(`[SCIM] Created user: ${user.userName} (${id})`);

  return c.json(user, 201);
});

// PUT /scim/v2/Users/:id — Replace user
scimRouter.put('/Users/:id', async (c) => {
  const id = c.req.param('id');
  const existing = users.get(id);
  if (!existing) {
    return c.json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'User not found', status: 404 }, 404);
  }

  const body = await c.req.json();
  const updated: SCIMUser = {
    ...existing,
    userName: body.userName || existing.userName,
    name: body.name || existing.name,
    emails: body.emails || existing.emails,
    active: body.active !== undefined ? body.active : existing.active,
    displayName: body.displayName || existing.displayName,
    title: body.title || existing.title,
    meta: {
      ...existing.meta,
      lastModified: new Date().toISOString(),
    },
  };

  users.set(id, updated);
  console.log(`[SCIM] Updated user: ${updated.userName} (${id})`);

  return c.json(updated);
});

// PATCH /scim/v2/Users/:id — Partial update (Okta uses this for deactivation)
scimRouter.patch('/Users/:id', async (c) => {
  const id = c.req.param('id');
  const existing = users.get(id);
  if (!existing) {
    return c.json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'User not found', status: 404 }, 404);
  }

  const body = await c.req.json();
  const operations = body.Operations || [];

  for (const op of operations) {
    if (op.op === 'replace' || op.op === 'Replace') {
      if (op.path === 'active' || (op.value && 'active' in op.value)) {
        existing.active = op.path === 'active' ? op.value : op.value.active;
      }
      if (op.value && typeof op.value === 'object') {
        if ('userName' in op.value) existing.userName = op.value.userName;
        if ('name' in op.value) existing.name = { ...existing.name, ...op.value.name };
        if ('displayName' in op.value) existing.displayName = op.value.displayName;
      }
    }
  }

  existing.meta.lastModified = new Date().toISOString();
  users.set(id, existing);
  console.log(`[SCIM] Patched user: ${existing.userName} (${id}), active=${existing.active}`);

  return c.json(existing);
});

// DELETE /scim/v2/Users/:id — Delete user
scimRouter.delete('/Users/:id', (c) => {
  const id = c.req.param('id');
  if (!users.has(id)) {
    return c.json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'User not found', status: 404 }, 404);
  }
  users.delete(id);
  console.log(`[SCIM] Deleted user: ${id}`);
  return c.body(null, 204);
});

// ─────────────────────────────────────────────────────────────────────────────
// /Groups endpoints
// ─────────────────────────────────────────────────────────────────────────────

// GET /scim/v2/Groups
scimRouter.get('/Groups', (c) => {
  const filter = c.req.query('filter');
  const startIndex = parseInt(c.req.query('startIndex') || '1');
  const count = parseInt(c.req.query('count') || '100');

  let allGroups = Array.from(groups.values());

  if (filter) {
    const match = filter.match(/displayName\s+eq\s+"([^"]+)"/i);
    if (match) {
      allGroups = allGroups.filter((g) => g.displayName === match[1]);
    }
  }

  const paged = allGroups.slice(startIndex - 1, startIndex - 1 + count);

  return c.json({
    schemas: [SCIM_SCHEMA_LIST],
    totalResults: allGroups.length,
    startIndex,
    itemsPerPage: paged.length,
    Resources: paged,
  });
});

// GET /scim/v2/Groups/:id
scimRouter.get('/Groups/:id', (c) => {
  const group = groups.get(c.req.param('id'));
  if (!group) {
    return c.json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Group not found', status: 404 }, 404);
  }
  return c.json(group);
});

// POST /scim/v2/Groups
scimRouter.post('/Groups', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const group: SCIMGroup = {
    schemas: [SCIM_SCHEMA_GROUP],
    id,
    externalId: body.externalId,
    displayName: body.displayName,
    members: body.members || [],
    meta: {
      resourceType: 'Group',
      created: now,
      lastModified: now,
      location: `/scim/v2/Groups/${id}`,
    },
  };

  groups.set(id, group);
  console.log(`[SCIM] Created group: ${group.displayName} (${id})`);
  return c.json(group, 201);
});

// PATCH /scim/v2/Groups/:id — Membership changes
scimRouter.patch('/Groups/:id', async (c) => {
  const id = c.req.param('id');
  const existing = groups.get(id);
  if (!existing) {
    return c.json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Group not found', status: 404 }, 404);
  }

  const body = await c.req.json();
  const operations = body.Operations || [];

  for (const op of operations) {
    if (op.op === 'add' && op.path === 'members') {
      const newMembers = Array.isArray(op.value) ? op.value : [op.value];
      existing.members.push(...newMembers);
    }
    if (op.op === 'remove' && op.path?.startsWith('members')) {
      const match = op.path.match(/members\[value eq "([^"]+)"\]/);
      if (match) {
        existing.members = existing.members.filter((m) => m.value !== match[1]);
      }
    }
    if (op.op === 'replace' && op.value?.displayName) {
      existing.displayName = op.value.displayName;
    }
  }

  existing.meta.lastModified = new Date().toISOString();
  groups.set(id, existing);
  return c.json(existing);
});

// DELETE /scim/v2/Groups/:id
scimRouter.delete('/Groups/:id', (c) => {
  const id = c.req.param('id');
  if (!groups.has(id)) {
    return c.json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], detail: 'Group not found', status: 404 }, 404);
  }
  groups.delete(id);
  return c.body(null, 204);
});

// ─────────────────────────────────────────────────────────────────────────────
// Service Provider Config (required by SCIM spec)
// ─────────────────────────────────────────────────────────────────────────────

scimRouter.get('/ServiceProviderConfig', (c) => {
  return c.json({
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
    documentationUri: 'https://excelai.app/docs/scim',
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        name: 'OAuth Bearer Token',
        description: 'Authentication using a Bearer token',
        type: 'oauthbearertoken',
        primary: true,
      },
    ],
  });
});

scimRouter.get('/Schemas', (c) => {
  return c.json({
    schemas: [SCIM_SCHEMA_LIST],
    totalResults: 2,
    Resources: [
      { id: SCIM_SCHEMA_USER, name: 'User' },
      { id: SCIM_SCHEMA_GROUP, name: 'Group' },
    ],
  });
});
