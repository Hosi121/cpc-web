#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_HTML = path.join(ROOT, 'index.html');
const SRC_CSS = path.join(ROOT, 'style.css');
const SRC_JS = path.join(ROOT, 'index.js');
const SRC_IMG = path.join(ROOT, 'wordcloud.png');
const DIST = path.join(ROOT, 'dist');

function readIfExists(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function minifyCSS(css) {
  // remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // shield url(...) contents
  const placeholders = {};
  let i = 0;
  css = css.replace(/url\([^)]*\)/g, (m) => {
    const key = `__URL_PLACEHOLDER_${i++}__`;
    placeholders[key] = m;
    return key;
  });
  // collapse whitespace and remove spaces around punctuation
  css = css.replace(/\s+/g, ' ')
           .replace(/\s*([{}:;,>])\s*/g, '$1')
           .replace(/;}/g, '}')
           .trim();
  // restore
  Object.entries(placeholders).forEach(([k, v]) => { css = css.replace(k, v); });
  return css;
}

function minifyJS(input) {
  const out = [];
  let inS = false, inD = false, inBT = false, esc = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const nxt = i + 1 < input.length ? input[i + 1] : '';

    if (inS) {
      out.push(ch);
      if (!esc && ch === '\'') inS = false;
      esc = ch === '\\' && !esc;
      continue;
    }
    if (inD) {
      out.push(ch);
      if (!esc && ch === '"') inD = false;
      esc = ch === '\\' && !esc;
      continue;
    }
    if (inBT) {
      out.push(ch);
      if (!esc && ch === '`') inBT = false;
      esc = ch === '\\' && !esc;
      continue;
    }

    if (ch === '\'') { inS = true; out.push(ch); esc = false; continue; }
    if (ch === '"') { inD = true; out.push(ch); esc = false; continue; }
    if (ch === '`') { inBT = true; out.push(ch); esc = false; continue; }

    // line comment
    if (ch === '/' && nxt === '/') {
      while (i < input.length && !/\r|\n/.test(input[i])) i++;
      continue;
    }
    // block comment
    if (ch === '/' && nxt === '*') {
      i += 2;
      while (i + 1 < input.length && !(input[i] === '*' && input[i + 1] === '/')) i++;
      i++; // advance to '/'
      continue;
    }

    out.push(ch);
  }
  let code = out.join('');
  // collapse whitespace lines
  code = code.split(/\r?\n/).map(l => l.trim()).filter(Boolean).join(' ');
  // remove spaces around punctuation
  code = code.replace(/\s*([=+\-*/%<>!&|^?:;,{}()\[\]])\s*/g, '$1').trim();
  return code;
}

function minifyHTML(html) {
  // remove regular comments (keep conditional comments)
  html = html.replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, '');
  // update asset refs
  html = html.replace('href="style.css"', 'href="style.min.css"')
             .replace('src="index.js"', 'src="index.min.js"');
  // collapse whitespace between tags and multiple spaces
  html = html.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  return html;
}

function main() {
  ensureDir(DIST);
  if (fs.existsSync(SRC_CSS)) {
    const css = readIfExists(SRC_CSS);
    fs.writeFileSync(path.join(DIST, 'style.min.css'), minifyCSS(css));
  }
  if (fs.existsSync(SRC_JS)) {
    const js = readIfExists(SRC_JS);
    fs.writeFileSync(path.join(DIST, 'index.min.js'), minifyJS(js));
  }
  if (fs.existsSync(SRC_HTML)) {
    const html = readIfExists(SRC_HTML);
    fs.writeFileSync(path.join(DIST, 'index.html'), minifyHTML(html));
  }
  if (fs.existsSync(SRC_IMG)) {
    fs.copyFileSync(SRC_IMG, path.join(DIST, path.basename(SRC_IMG)));
  }
  console.log('Minified assets written to', DIST);
}

main();

