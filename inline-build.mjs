import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');
const htmlPath = join(distDir, 'index.html');

let html = readFileSync(htmlPath, 'utf-8');

// Inline CSS
const cssMatch = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/g);
if (cssMatch) {
  cssMatch.forEach(tag => {
    const hrefMatch = tag.match(/href="([^"]+)"/);
    if (hrefMatch) {
      const cssFile = hrefMatch[1];
      const cssPath = join(distDir, cssFile);
      try {
        const css = readFileSync(cssPath, 'utf-8');
        html = html.replace(tag, `<style>${css}</style>`);
        console.log('✓ Inlined CSS:', cssFile);
      } catch (e) {
        console.warn('Could not inline CSS:', cssFile);
      }
    }
  });
}

// Inline JS
const jsMatch = html.match(/<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/g);
if (jsMatch) {
  jsMatch.forEach(tag => {
    const srcMatch = tag.match(/src="([^"]+)"/);
    if (srcMatch) {
      const jsFile = srcMatch[1];
      const jsPath = join(distDir, jsFile);
      try {
        const js = readFileSync(jsPath, 'utf-8');
        const typeMatch = tag.match(/type="([^"]+)"/);
        const type = typeMatch ? ` type="${typeMatch[1]}"` : '';
        html = html.replace(tag, `<script${type}>${js}</script>`);
        console.log('✓ Inlined JS:', jsFile);
      } catch (e) {
        console.warn('Could not inline JS:', jsFile);
      }
    }
  });
}

writeFileSync(htmlPath, html, 'utf-8');
console.log('\n✓ Build inlined successfully!\n');