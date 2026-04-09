# ExcelAI Admin Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Supabase Setup](#supabase-setup)
5. [Deployment](#deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Development
- Node.js 18+
- npm 9+
- Git

### Production
- Static hosting (Vercel, Netlify, Cloudflare Pages)
- Supabase project (free tier sufficient for collaboration features)

---

## Installation

```bash
git clone https://github.com/nclamvn/excel-as-matrix.git
cd excel-as-matrix

npm install

# Development
npm run dev            # Frontend (Vite)
npm run dev:server     # Backend (Hono + WebSocket)
npm run dev:all        # Both concurrently

# Production build
npm run build
```

---

## Environment Configuration

Create `.env.local` in the project root:

```bash
# Supabase (required for real-time collaboration)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Without Supabase
The app works in **single-user local mode**:
- No real-time collaboration
- No presence indicators
- Data stored in browser localStorage/IndexedDB
- All other features work normally

---

## Supabase Setup

### 1. Create a project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose organization and region (closest to your users)
4. Wait for initialization (~2 minutes)

### 2. Get credentials
1. Go to **Settings > API**
2. Copy **Project URL** -> `VITE_SUPABASE_URL`
3. Copy **anon public** key -> `VITE_SUPABASE_ANON_KEY`

### 3. Enable Realtime
ExcelAI uses Supabase Realtime Broadcast (no database tables needed):
- Presence channels for user tracking
- Broadcast channels for cell updates, cursor positions, notifications

### 4. Verify connection
After configuring `.env.local`, restart the dev server and check:
- Header should show "Live" indicator (green dot)
- Opening two tabs should show 2 avatars

---

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel

# Set environment variables in Vercel dashboard:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend server (optional)
The backend provides:
- WebSocket collaboration fallback
- AI proxy endpoints
- Google Sheets import proxy

```bash
npm run build:server
npm run start:server
```

---

## Monitoring

### Health check
```bash
# Backend API
curl http://localhost:3001/api/health

# Frontend
curl -I http://localhost:5173
```

### Key metrics
| Metric | Value |
|--------|-------|
| Build time | ~19s |
| Bundle size | ~3MB (gzipped ~640KB) |
| Unit tests | 1,884 passing |
| E2E tests | 22 passing |
| Source files | 662+ |

---

## Troubleshooting

### "Supabase not connected" / No "Live" indicator
1. Verify `.env.local` exists with correct values
2. URL format must be `https://xxx.supabase.co`
3. Restart dev server after changing env variables
4. Check browser console for WebSocket errors

### Import fails
- `.xlsx` files: Parsed by ExcelJS
- `.xls` files: Parsed by SheetJS (legacy format)
- Google Sheets: Must be shared publicly
- Large files (>50MB): May timeout

### Collaboration not working
1. Both users must open the same workbook URL
2. Supabase must be configured and reachable
3. Check for firewall/proxy blocking WebSocket connections

### Build fails
```bash
# Check TypeScript errors
npx tsc --noEmit

# Check for dependency issues
npm audit
npm ls --depth=0
```

---

## Security Notes

- Supabase anon key is safe to expose (it's a public key with RLS)
- Never expose the Supabase service_role key in frontend code
- All data validation happens client-side; add server-side validation for production
- The `.env.local` file is gitignored by default

---

## Backup & Recovery

### Data storage locations
- **Browser**: IndexedDB (auto-save versions, settings)
- **Cloud**: Supabase (when configured)

### Manual backup
1. File > Export > Excel (.xlsx)
2. Store the file safely

### Restore from backup
1. File > Import > Select the backup .xlsx file
