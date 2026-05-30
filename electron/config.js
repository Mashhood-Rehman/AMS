import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isBundledDesktopBuild = fs.existsSync(path.join(__dirname, '.bundled-mode'));

/**
 * Live deployment URLs for the packaged desktop app.
 * The production desktop app loads the Vercel site (same as the browser).
 */
export const LIVE_FRONTEND_URL =
  process.env.AMS_LIVE_FRONTEND_URL || 'https://ams-coral-zeta.vercel.app';

/** Live backend (Render) — no trailing slash */
export const LIVE_BACKEND_URL =
  process.env.AMS_LIVE_BACKEND_URL || 'https://ams-h6zw.onrender.com';

/**
 * API base — must end with /api (used for bundled desktop + must match Vercel VITE_API_URL).
 */
export const LIVE_API_URL =
  process.env.AMS_LIVE_API_URL || `${LIVE_BACKEND_URL}/api`;

/** When true, the .exe opens the live Vercel app (recommended). */
export const USE_LIVE_WEB_APP =
  !isBundledDesktopBuild && process.env.AMS_USE_LIVE_WEB !== '0';

export const isAllowedAppUrl = (url) => {
  try {
    const target = new URL(url);
    const allowed = new URL(LIVE_FRONTEND_URL);
    return target.origin === allowed.origin;
  } catch {
    return false;
  }
};
