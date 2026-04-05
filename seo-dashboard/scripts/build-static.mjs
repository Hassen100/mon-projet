import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const browserDir = join(process.cwd(), 'dist', 'seo-dashboard', 'browser');
const csrIndex = join(browserDir, 'index.csr.html');
const indexHtml = join(browserDir, 'index.html');
const notFound = join(browserDir, '404.html');

if (!existsSync(csrIndex)) {
  throw new Error(`Missing file: ${csrIndex}`);
}

copyFileSync(csrIndex, indexHtml);
copyFileSync(csrIndex, notFound);

console.log('Static browser build prepared for GitHub Pages/Vercel.');
