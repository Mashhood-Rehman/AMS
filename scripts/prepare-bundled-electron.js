import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOCAL_API_URL } from '../electron/config.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
fs.writeFileSync(path.join(root, 'electron', '.bundled-mode'), 'bundled\n');
fs.writeFileSync(
  path.join(root, 'electron', 'desktop-api-url.cjs'),
  `// Auto-generated — do not edit. Re-run npm run build to refresh.\nmodule.exports = { API_URL: '${LOCAL_API_URL}' };\n`
);
