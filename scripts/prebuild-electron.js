import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist_electron');

const killWindows = () => {
  const names = ['AMS Attendance.exe', 'electron.exe'];
  for (const name of names) {
    try {
      execSync(`taskkill /F /IM "${name}" /T`, { stdio: 'ignore' });
      console.log(`Closed: ${name}`);
    } catch {
      // not running
    }
  }
};

const removeDir = (dir) => {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 });
};

console.log('Preparing Electron build…');
if (process.platform === 'win32') killWindows();

try {
  removeDir(distDir);
  console.log('Removed old dist_electron folder.');
} catch (err) {
  console.warn(
    'Could not delete dist_electron. Close AMS Attendance / Electron, close File Explorer in that folder, then run npm run build again.'
  );
  console.warn(err.message);
  process.exit(1);
}
