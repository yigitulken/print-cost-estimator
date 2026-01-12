# Environment Variables Reference

## Backend (Server) Environment Variables

### Cloudflare R2 Configuration
```bash
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=your-bucket-name
```

### Upload Security
```bash
UPLOAD_TOKEN_SECRET=your-secure-random-secret-min-32-chars
```

Generate a secure token secret:
```bash
openssl rand -base64 32
```

### Optional Server Variables

```bash
PORT=3001              # Server port (default: 3001)
NODE_ENV=production    # Environment (development/production)
```

## Frontend (Web) Environment Variables

### API Base URL (Production)
```bash
VITE_API_BASE_URL=https://api.octamak.com
```

**When to set:**
- **Production (Cloudflare Pages)**: Set to your Railway backend URL (e.g., `https://api.octamak.com`)
- **Local Development**: Leave unset (defaults to relative paths, works with Vite proxy)

**Note:** This variable is optional for local development. When not set, API calls use relative paths which work with the local dev server proxy.

## Getting R2 Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → **Overview**
3. Create a bucket (e.g., `stl-uploads`)
4. Go to **R2** → **Manage R2 API Tokens**
5. Create API token with:
   - **Permissions**: Object Read & Write
   - **Bucket**: Your bucket name
6. Copy **Access Key ID** and **Secret Access Key**
7. Find **Account ID** in the URL: `dash.cloudflare.com/<ACCOUNT_ID>/r2`

## Usage

### Development (without R2)
```bash
# Only files ≤25MB supported
cd apps/server
pnpm dev
```

### Development (with R2)
```bash
# Full 400MB support
export R2_ACCOUNT_ID=...
export R2_ACCESS_KEY_ID=...
export R2_SECRET_ACCESS_KEY=...
export R2_BUCKET=...
export UPLOAD_TOKEN_SECRET=$(openssl rand -base64 32)

cd apps/server
pnpm dev
```

### Production

**Backend (Railway):**
Create a `.env` file in `apps/server/` with all backend variables, or set them in your Railway environment.

**Frontend (Cloudflare Pages):**
Set environment variables in Cloudflare Pages dashboard:
- `VITE_API_BASE_URL=https://api.octamak.com` (or your Railway backend URL)

## Behavior Without R2

If R2 environment variables are not set:
- ✅ Files **≤25MB**: Use legacy `/api/analyze` endpoint
- ❌ Files **>25MB**: Return error `service_unavailable`

This allows development/testing without R2 setup for small files.
