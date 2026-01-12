# Quick Fix Guide - Production Issue

## 🚨 Current Issue
- Frontend: "Failed to initialize upload. Please try again."
- Backend: Some routes return "Cannot GET /"

## ✅ Solution (3 Steps)

### Step 1: Set Frontend Environment Variable

In **Cloudflare Pages Dashboard**:
1. Go to Settings → Environment Variables
2. Add production variable:
   ```
   VITE_API_BASE_URL = https://api.octamak.com
   ```
3. Save and **redeploy** (or push code to trigger redeploy)

### Step 2: Set Backend Environment Variables

In **Railway Dashboard**:
1. Go to Variables tab
2. Ensure these are set:
   ```
   R2_ACCOUNT_ID = <your-cloudflare-account-id>
   R2_ACCESS_KEY_ID = <your-r2-access-key>
   R2_SECRET_ACCESS_KEY = <your-r2-secret-key>
   R2_BUCKET_NAME = <your-bucket-name>
   UPLOAD_TOKEN_SECRET = <any-random-32-char-string>
   ```
3. Trigger **manual redeploy** to ensure latest code is deployed

### Step 3: Verify It Works

Test these URLs in your browser:

```bash
# 1. Check API is alive
https://api.octamak.com/
# Should show: {"ok":true,"service":"print-cost-server",...}

# 2. Check health endpoints
https://api.octamak.com/health
https://api.octamak.com/api/health
# Both should show: {"ok":true,"status":"healthy",...}

# 3. Test the frontend
https://www.octamak.com
# Upload a file and check:
# - Open DevTools → Network tab
# - Should see requests to api.octamak.com (not www.octamak.com)
# - No CORS errors
# - Upload completes successfully
```

## 📊 What If It Still Doesn't Work?

### Check Frontend Build
```bash
# The API URL should be baked into the JavaScript bundle
curl -s https://www.octamak.com/assets/index-*.js | grep "api.octamak.com"
# Should output: https://api.octamak.com
```

If empty → Environment variable wasn't set before build → Redeploy after setting it.

### Check Backend Logs
In Railway Dashboard → Deployments → View Logs

Look for:
- ✅ "🚀 Server running on http://localhost:PORT"
- ✅ "📡 API endpoints:" (lists all routes)
- ❌ Any errors mentioning R2, CORS, or missing modules

### Check Browser Console
On www.octamak.com → DevTools → Console

Look for:
- ❌ CORS errors → Check backend CORS configuration
- ❌ 404 errors to api.octamak.com → Backend not deployed properly
- ❌ Failed to fetch → Network issue or backend down

---

## 🎯 Why This Fixes It

**Without `VITE_API_BASE_URL`:**
- Frontend calls `/api/uploads/init` (same-origin)
- Browser requests `https://www.octamak.com/api/uploads/init`
- Cloudflare Pages doesn't have this route → 404 error
- User sees "Failed to initialize upload"

**With `VITE_API_BASE_URL=https://api.octamak.com`:**
- Frontend calls `https://api.octamak.com/api/uploads/init` (cross-origin)
- Railway backend handles the request
- CORS headers allow www.octamak.com
- Upload works ✅

---

## 📖 Full Documentation

See [DEPLOY.md](./DEPLOY.md) for:
- Complete deployment guide
- Troubleshooting section
- Environment variable reference
- Build configuration
- Monitoring tips

See [PRODUCTION_FIX_SUMMARY.md](./PRODUCTION_FIX_SUMMARY.md) for:
- Detailed analysis of the issue
- What was changed in the codebase
- Expected behavior after fix
- Testing commands

---

**TL;DR:** Set `VITE_API_BASE_URL` in Cloudflare Pages, set R2 variables in Railway, redeploy both. Done! 🚀
