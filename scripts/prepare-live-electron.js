import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const flag = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'electron', '.bundled-mode');
if (fs.existsSync(flag)) fs.unlinkSync(flag);
