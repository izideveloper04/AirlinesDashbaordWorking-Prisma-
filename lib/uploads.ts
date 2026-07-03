// lib/uploads.ts
import path from 'path';

// On platforms with a single persistent volume (e.g. Railway), UPLOAD_DIR
// points at that volume so uploads survive redeploys. Falls back to the
// public folder for local dev where the whole project directory persists.
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'images', 'uploads');
export const UPLOAD_URL_PREFIX = '/images/uploads/';
