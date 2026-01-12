# 3D Print Cost Estimator

A prototype application for estimating 3D printing costs. Upload an STL file, view it in 3D, and get instant price estimates for FDM, SLA, and SLS printing technologies.

## Features

- **STL File Upload**: Supports binary STL format (up to 400MB with multipart upload)
- **3D Preview**: Interactive 3D viewer with rotate and zoom controls
- **Instant Analysis**: Computes volume, surface area, and bounding box dimensions
- **Price Estimates**: FDM (PLA), SLA (Resin), and SLS (PA12) pricing in TRY
- **Large File Support**: Multipart upload to Cloudflare R2 for files >25MB
- **Advanced FDM Estimation**: Customizable print profiles (layer height, infill, walls, etc.)

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **3D Rendering**: @react-three/fiber + @react-three/drei
- **Testing**: Vitest + Supertest
- **Shared Types**: TypeScript package

## Project Structure

```
print-cost-estimator/
├── apps/
│   ├── server/          # Express API server
│   │   ├── src/
│   │   │   ├── index.ts           # Server entry point
│   │   │   ├── stl-parser.ts      # STL parsing (binary + ASCII)
│   │   │   └── price-calculator.ts # Price calculation logic
│   │   └── tests/
│   │       ├── fixtures/          # STL test fixtures
│   │       ├── stl-parser.test.ts
│   │       ├── price-calculator.test.ts
│   │       └── api.test.ts
│   └── web/             # React frontend
│       └── src/
│           ├── App.tsx
│           └── components/
│               ├── FileUpload.tsx
│               ├── STLViewer.tsx
│               └── ResultsPanel.tsx
└── packages/
    └── shared/          # Shared TypeScript types
        └── src/
            └── index.ts
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Installation

```bash
# Clone the repository
cd print-cost-estimator

# Install dependencies
pnpm install
```

## Development

Run both the server and web app in development mode:

```bash
pnpm dev
```

This starts:
- **Server**: http://localhost:3001
- **Web App**: http://localhost:5173

## Testing

Run all tests:

```bash
pnpm test
```

## Build

Build all packages for production:

```bash
pnpm build
```

## Deployment

For complete deployment instructions, environment variables, troubleshooting, and verification checklists, see **[DEPLOY.md](./DEPLOY.md)**.

### Quick Overview

- **Frontend**: Cloudflare Pages at `https://www.octamak.com`
- **Backend**: Railway at `https://api.octamak.com`

**Required Environment Variables:**

Cloudflare Pages:
```bash
VITE_API_BASE_URL=https://api.octamak.com
```

Railway:
```bash
R2_ACCOUNT_ID=<cloudflare-r2-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_BUCKET_NAME=<bucket-name>
UPLOAD_TOKEN_SECRET=<random-32-char-string>
```

**Health Endpoints:**
- `GET /` → Returns API info
- `GET /health` → Health check
- `GET /api/health` → Health check (alias)

## API Reference

### POST /api/analyze

Analyze an STL file and get pricing estimates.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Field: `file` (STL file, max 200MB)

**Success Response (200):**

```json
{
  "volume_cm3": 1.0,
  "bounding_box_mm": {
    "x": 10.0,
    "y": 10.0,
    "z": 10.0
  },
  "prices_try": {
    "fdm_pla": 160,
    "sla_resin": 330,
    "sls_pa12": 640
  },
  "meta": {
    "file_name": "cube.stl",
    "file_size_bytes": 684,
    "parse_ms": 1,
    "compute_ms": 0
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `unsupported_format` | Only STL files are supported |
| 413 | `file_too_large` | File exceeds 200MB limit |
| 422 | `invalid_mesh` | Corrupt or empty STL file |
| 500 | `internal_error` | Unexpected server error |

**Error Format:**

```json
{
  "error": {
    "code": "error_code",
    "message": "Human readable message",
    "details": {}
  }
}
```

### curl Example

```bash
# Analyze an STL file
curl -X POST http://localhost:3001/api/analyze \
  -F "file=@/path/to/model.stl" \
  | jq

# Health check
curl http://localhost:3001/health
```

## Pricing Formula

```
EstimatedPriceTRY = BaseFeeTRY + (VolumeCm3 × RateTRYPerCm3)
Final price rounded to nearest 10 TRY
```

| Technology | Base Fee (TRY) | Rate (TRY/cm³) |
|------------|----------------|----------------|
| FDM (PLA)  | 150            | 12             |
| SLA (Resin)| 300            | 30             |
| SLS (PA12) | 600            | 45             |

## License

MIT

