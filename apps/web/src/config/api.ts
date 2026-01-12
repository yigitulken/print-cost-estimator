// ============================================================
// Centralized API Configuration
// ============================================================

/**
 * Get the API base URL from environment variables
 * Defaults to empty string (same-origin) for local development
 */
const rawApiBase = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * API base URL with trailing slash removed
 */
export const API_BASE = rawApiBase.replace(/\/+$/, '');

/**
 * Build a complete API URL from a path
 * Ensures exactly one slash between base and path
 * 
 * @example
 * apiUrl('/api/analyze') -> 'https://api.octamak.com/api/analyze' (production)
 * apiUrl('/api/analyze') -> '/api/analyze' (local development)
 */
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // If no API base, return path as-is (same-origin)
  if (!API_BASE) {
    return normalizedPath;
  }
  
  // Combine base and path
  return `${API_BASE}${normalizedPath}`;
}
