import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isBundledDesktopBuild = fs.existsSync(path.join(__dirname, '.bundled-mode'));

/**
 * Local backend for the bundled desktop app (.exe).
 * Start it before opening the desktop app: npm run dev:backend
 * Uses DATABASE_URL from backend/.env (local PostgreSQL).
 */
export const LOCAL_BACKEND_URL =
  process.env.AMS_LOCAL_BACKEND_URL || 'http://localhost:5000';

/** Local API base — must end with /api */
export const LOCAL_API_URL =
  process.env.AMS_LOCAL_API_URL || `${LOCAL_BACKEND_URL}/api`;

/**
 * Live deployment URLs (build:desktop-live — opens Vercel in Electron).
 */
export const LIVE_FRONTEND_URL =
  process.env.AMS_LIVE_FRONTEND_URL || 'https://ams-coral-zeta.vercel.app';

/** Live backend (Render) — no trailing slash */
export const LIVE_BACKEND_URL =
  process.env.AMS_LIVE_BACKEND_URL || 'https://ams-h6zw.onrender.com';

/** Live API base — must end with /api (Vercel web deploy) */
export const LIVE_API_URL =
  process.env.AMS_LIVE_API_URL || `${LIVE_BACKEND_URL}/api`;

/** When true, the .exe opens the live Vercel app (recommended). */
export const USE_LIVE_WEB_APP =
  !isBundledDesktopBuild && process.env.AMS_USE_LIVE_WEB !== '0';

export const isAllowedAppUrl = (url) => {
  try {
    const target = new URL(url);
    if (target.protocol === 'file:') return true;
    if (target.hostname === 'localhost' || target.hostname === '127.0.0.1') return true;
    const allowed = new URL(LIVE_FRONTEND_URL);
    return target.origin === allowed.origin;
  } catch {
    return false;
  }
};
