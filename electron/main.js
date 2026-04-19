import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  // In development, the backend is started by the root dev script.
  if (!app.isPackaged) return;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'database.db');
  const templateDbPath = path.join(process.resourcesPath, 'backend/database-template.db');
  const backendPath = path.join(process.resourcesPath, 'backend/index.js');

  // Ensure the database exists in the writable userData directory
  if (!fs.existsSync(dbPath)) {
    try {
      if (fs.existsSync(templateDbPath)) {
        fs.copyFileSync(templateDbPath, dbPath);
        console.log('Database initialized from template at:', dbPath);
      } else {
        console.error('Template database not found at:', templateDbPath);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  // Use the Electron executable to run the backend (truly portable)
  backendProcess = fork(backendPath, [], {
    stdio: 'inherit',
    env: { 
      ...process.env, 
      PORT: 5000,
      DATABASE_URL: `file:${dbPath}`
    }
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend process:', err);
  });
}

app.whenReady().then(() => {
  startBackend();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
