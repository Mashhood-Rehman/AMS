import { app, BrowserWindow, shell, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  LIVE_FRONTEND_URL,
  USE_LIVE_WEB_APP,
  isAllowedAppUrl,
} from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function setupPermissions() {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['geolocation', 'media', 'notifications'];
    callback(allowed.includes(permission));
  });
}

function createMainWindow() {
  const isDev = !app.isPackaged;
  const useLiveWeb = USE_LIVE_WEB_APP && !isDev;

  const webPreferences = {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false,
  };

  // Preload only for local dev/bundled UI (not needed for remote Vercel shell)
  if (!useLiveWeb) {
    webPreferences.preload = path.join(__dirname, 'preload.cjs');
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'AMS — Attendance Management',
    webPreferences,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else if (useLiveWeb) {
    mainWindow.loadURL(`${LIVE_FRONTEND_URL}/#/login`);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'), {
      hash: '/login',
    });
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedAppUrl(url)) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedAppUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupPermissions();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
