/**
 * Centralized Backend API URL resolver for Xentro.
 * Automatically adapts between local development, Vercel deployments, and the live Render backend.
 */

const DEFAULT_PRODUCTION_BACKEND = 'https://xentro-tejh.onrender.com/api/v1';

export function getBackendBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const publicUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (publicUrl && !publicUrl.includes('127.0.0.1') && !publicUrl.includes('localhost')) {
      return publicUrl.replace(/\/+$/, '');
    }
    // In browser, if on production host (vercel / custom domain), use live production backend
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return DEFAULT_PRODUCTION_BACKEND;
    }
    return (publicUrl || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '');
  }

  // Server-side (Vercel Serverless / Node.js)
  const envUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (envUrl && !envUrl.includes('127.0.0.1') && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '');
  }
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return DEFAULT_PRODUCTION_BACKEND;
  }
  return (envUrl || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '');
}
