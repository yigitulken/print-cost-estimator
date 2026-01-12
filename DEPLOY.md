# Deployment Guide - Octamak Print Cost Estimator

This guide covers deploying the monorepo application to production environments.

## Architecture Overview

- **Frontend (apps/web)**: React + Vite → Cloudflare Pages
- **Backend (apps/server)**: Express API → Railway
- **Shared Package**: TypeScript types shared between frontend and backend

## Production URLs

- **Website**: https://www.octamak.com (Cloudflare Pages)
- **API**: https://api.octamak.com (Railway)

---

## 🌐 Frontend Deployment (Cloudflare Pages)

### Required Environment Variables

Set these in Cloudflare Pages dashboard under Settings → Environment variables:

```bash
VITE_API_BASE_URL=https://api.octamak.com
```

### Build Configuration

- **Build command**: `pnpm install && pnpm run build:web`
- **Build output directory**: `apps/web/dist`
- **Root directory**: `/` (workspace root)
- **Node version**: 18 or higher
- **Package manager**: pnpm

### DNS Configuration

In Cloudflare DNS:

```
www     CNAME    <your-pages-project>.pages.dev    [Proxied]
@       CNAME    <your-pages-project>.pages.dev    [Proxied]
```

Or if using a redirect for apex domain:

```
www     CNAME    <your-pages-project>.pages.dev    [Proxied]
@       A        192.0.2.1                          [Proxied]  (page rule redirects to www)
```

---

## 🚂 Backend Deployment (Railway)

### Required Environment Variables

Railway auto-provides `PORT`, but you need to set:

```bash
# R2 Storage (for multipart uploads)
R2_ACCOUNT_ID=<your-cloudflare-account-id>
R2_ACCESS_KEY_ID=<your-r2-access-key>
R2_SECRET_ACCESS_KEY=<your-r2-secret-key>
R2_BUCKET_NAME=<your-bucket-name>
R2_PUBLIC_URL=<your-r2-public-url-if-needed>

# JWT Secret (for upload tokens)
UPLOAD_TOKEN_SECRET=<random-32-char-string>

# Optional: Node environment
NODE_ENV=production
```

⚠️ **Important**: The server code already uses `process.env.PORT` (Railway auto-assigns this).

### Build Configuration

Railway should auto-detect the monorepo. If you need to configure manually:

- **Build command**: `pnpm install && pnpm run build:server`
- **Start command**: `pnpm --filter @print-cost/server start`
- **Root directory**: `/` (workspace root)
- **Watch paths**: `apps/server/**`, `packages/shared/**`

### Custom Domain

In Railway:
1. Go to Settings → Networking → Custom Domain
2. Add `api.octamak.com`
3. Copy the CNAME record value

In Cloudflare DNS:
```
api     CNAME    <railway-provided-domain>    [DNS Only - not proxied]
```

⚠️ **Critical**: Set to **DNS Only** (gray cloud), not Proxied (orange cloud), for Railway custom domains.

---

## 📦 Monorepo Build Order

The build system ensures dependencies are built in the correct order:

```bash
# Full build (all packages)
pnpm run build

# Web app + dependencies
pnpm run build:web

# Server + dependencies
pnpm run build:server
```

**Build order**:
1. `packages/shared` (types/constants)
2. `apps/web` or `apps/server` (depending on target)

This is handled automatically by the build scripts.

---

## 🔐 CORS Configuration

The backend (`apps/server/src/index.ts`) is configured to allow:

- `https://octamak.com`
- `https://www.octamak.com`
- `http://localhost:5173` (local dev)
- `http://localhost:3000` (alternative local)
- `*.pages.dev` (Cloudflare preview deployments)

**To add more origins**, edit `allowedOrigins` array in `apps/server/src/index.ts`.

---

## ✅ Deployment Verification Checklist

After deploying both frontend and backend:

### 1. **Health Checks**
Visit these URLs and verify JSON responses:

- [ ] https://api.octamak.com/ → `{"ok":true,"service":"print-cost-server",...}`
- [ ] https://api.octamak.com/health → `{"ok":true,"status":"healthy",...}`
- [ ] https://api.octamak.com/api/health → `{"ok":true,"status":"healthy",...}`

### 2. **Website Functionality**
- [ ] Open https://www.octamak.com
- [ ] Upload a small STL file (<25MB) → should use legacy endpoint
- [ ] Upload a large STL file (>25MB, <400MB) → should use multipart upload
- [ ] Verify pricing results are displayed correctly
- [ ] Check browser DevTools console for errors
- [ ] Verify no CORS errors in Network tab

### 3. **Cross-Origin API Calls**
- [ ] Open DevTools Network tab on www.octamak.com
- [ ] Upload an STL file
- [ ] Confirm requests go to `api.octamak.com` (not same-origin)
- [ ] Check for proper CORS headers:
  - `access-control-allow-origin: https://www.octamak.com`
  - No preflight failures

### 4. **Error Handling**
- [ ] Upload an invalid file format → should show clear error
- [ ] Upload a file that's too large (>400MB) → should show size error
- [ ] Disconnect network mid-upload → should show network error
- [ ] Verify error messages are user-friendly (not cryptic codes)

---

## 🛠️ Local Development

### Prerequisites
```bash
node >= 18.0.0
pnpm >= 8.15.0
```

### Setup
```bash
# Install dependencies
pnpm install

# Build shared package first (required for types)
pnpm --filter @print-cost/shared build

# Start dev servers (both frontend and backend)
pnpm run dev
```

This starts:
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:3001 (Express API)

### Local Environment Variables

Create `apps/web/.env.local`:
```bash
# Leave empty or comment out for same-origin API calls during local dev
# VITE_API_BASE_URL=http://localhost:3001
```

Create `apps/server/.env` (optional for R2 testing):
```bash
PORT=3001
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
UPLOAD_TOKEN_SECRET=...
```

---

## 🐛 Troubleshooting

### Issue: "Failed to initialize upload. Please try again."

**Cause**: Frontend can't reach backend, or R2 is misconfigured.

**Solutions**:
1. Check `VITE_API_BASE_URL` is set correctly in Cloudflare Pages
2. Verify Railway backend is running: visit `https://api.octamak.com/health`
3. Check Railway logs for R2 errors
4. Ensure `R2_*` environment variables are set in Railway

### Issue: "Cannot GET /"

**Cause**: Server route is missing or not deployed.

**Solutions**:
- Latest code has `app.get('/')` returning JSON
- Redeploy backend on Railway
- Check Railway deployment logs for build errors

### Issue: CORS errors in browser

**Cause**: Origin not allowed, or DNS misconfigured.

**Solutions**:
1. Verify request is from `https://www.octamak.com` (not `http://` or `https://octamak.com`)
2. Check CORS allowlist in `apps/server/src/index.ts`
3. Ensure `api.octamak.com` DNS points to Railway (DNS only, not proxied)
4. Check Railway environment doesn't have a `CORS_ORIGIN` override

### Issue: Build fails with "Cannot find module @print-cost/shared"

**Cause**: Shared package not built before apps.

**Solutions**:
1. Use recommended build commands: `pnpm run build:web` or `pnpm run build:server`
2. Ensure Cloudflare/Railway use workspace root as working directory
3. Manually build shared first: `pnpm --filter @print-cost/shared build`

---

## 📊 Monitoring

### Railway Logs
```bash
# View via Railway dashboard
Project → Deployments → [Select deployment] → View Logs

# Key things to watch:
- "🚀 Server running on http://localhost:PORT"
- "📡 API endpoints:" (should list all routes)
- Error messages from failed uploads or analyses
```

### Cloudflare Pages Logs
```bash
# View via Cloudflare dashboard
Pages → [Your project] → Deployments → [Select deployment] → Build log

# Key things to watch:
- Build succeeds without TypeScript errors
- "dist" folder is created with expected files
```

### Analytics (Optional)
- Set up Cloudflare Web Analytics for frontend usage
- Railway provides basic metrics (CPU, memory, requests)
- Consider adding Sentry for error tracking in production

---

## 🔄 CI/CD Workflow

### Cloudflare Pages (Automatic)
- Push to `main` branch → auto-deploys to production
- Push to other branches → creates preview deployment at `<branch>.<project>.pages.dev`

### Railway (Automatic)
- Push to `main` branch → auto-deploys to production
- Automatic rollback if health checks fail (configure under Settings)

---

## 📝 Environment Variables Reference

| Variable | Frontend | Backend | Required | Example |
|----------|----------|---------|----------|---------|
| `VITE_API_BASE_URL` | ✅ | ❌ | ✅ (prod) | `https://api.octamak.com` |
| `PORT` | ❌ | ✅ | Auto | `3001` |
| `R2_ACCOUNT_ID` | ❌ | ✅ | ✅ | `abc123...` |
| `R2_ACCESS_KEY_ID` | ❌ | ✅ | ✅ | `xyz789...` |
| `R2_SECRET_ACCESS_KEY` | ❌ | ✅ | ✅ | `secret...` |
| `R2_BUCKET_NAME` | ❌ | ✅ | ✅ | `stl-uploads` |
| `UPLOAD_TOKEN_SECRET` | ❌ | ✅ | ✅ | `random32chars...` |
| `NODE_ENV` | ❌ | ✅ | Optional | `production` |

---

## 🚀 Quick Deploy Commands

```bash
# Deploy frontend (Cloudflare Pages via Git push)
git push origin main

# Deploy backend (Railway via Git push)
git push origin main

# Force rebuild without code changes
# - Cloudflare: Retry deployment in dashboard
# - Railway: Trigger redeploy in dashboard
```

---

## 📞 Support

If deployment issues persist:
1. Check Railway logs for server errors
2. Check Cloudflare Pages build logs
3. Verify all environment variables are set correctly
4. Test API health endpoints directly in browser
5. Check browser console and network tab for frontend errors

---

**Last Updated**: January 2026  
**Maintainer**: Octamak Team
