#!/usr/bin/env python3
import os
import re
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
SRC_HTML = ROOT / 'index.html'
SRC_CSS = ROOT / 'style.css'
SRC_JS = ROOT / 'index.js'
SRC_IMG = ROOT / 'wordcloud.png'
DIST = ROOT / 'dist'


def minify_css(css: str) -> str:
    # Remove comments
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    # Preserve data URLs by temporarily shielding url('...') contents
    placeholders = {}
    def _shield(m):
        key = f"__URL_PLACEHOLDER_{len(placeholders)}__"
        placeholders[key] = m.group(0)
        return key
    css = re.sub(r"url\([^)]*\)", _shield, css)

    # Collapse whitespace
    css = re.sub(r"\s+", " ", css)
    # Remove spaces around punctuation
    css = re.sub(r"\s*([{}:;,>])\s*", r"\1", css)
    # Remove trailing semicolons before }
    css = re.sub(r";\}", "}", css)
    # Restore urls
    for key, val in placeholders.items():
        css = css.replace(key, val)
    return css.strip()


def minify_js(js: str) -> str:
    # Basic tokenizer to strip comments safely (strings aware)
    out = []
    i = 0
    n = len(js)
    in_s = in_d = in_bt = False
    escape = False
    while i < n:
        ch = js[i]
        nxt = js[i+1] if i + 1 < n else ''
        if in_s:
            out.append(ch)
            if not escape and ch == "'":
                in_s = False
            escape = (ch == "\\") and not escape
            i += 1
            continue
        if in_d:
            out.append(ch)
            if not escape and ch == '"':
                in_d = False
            escape = (ch == "\\") and not escape
            i += 1
            continue
        if in_bt:
            out.append(ch)
            if not escape and ch == '`':
                in_bt = False
            escape = (ch == "\\") and not escape
            i += 1
            continue

        # Enter string states
        if ch == "'":
            in_s = True
            out.append(ch)
            i += 1
            escape = False
            continue
        if ch == '"':
            in_d = True
            out.append(ch)
            i += 1
            escape = False
            continue
        if ch == '`':
            in_bt = True
            out.append(ch)
            i += 1
            escape = False
            continue

        # Line comment //
        if ch == '/' and nxt == '/':
            # skip until newline
            i += 2
            while i < n and js[i] not in '\r\n':
                i += 1
            continue
        # Block comment /* ... */
        if ch == '/' and nxt == '*':
            i += 2
            while i + 1 < n and not (js[i] == '*' and js[i+1] == '/'):
                i += 1
            i += 2 if i + 1 < n else 0
            continue

        out.append(ch)
        i += 1

    code = ''.join(out)
    # Collapse whitespace sequences to single spaces outside strings using a light pass
    # A safe heuristic: remove indentation and extra newlines
    lines = [ln.strip() for ln in code.splitlines()]
    code = ' '.join([ln for ln in lines if ln])
    # Remove spaces around common punctuation
    code = re.sub(r"\s*([=+\-*/%<>!&|^?:;,{}()\[\]])\s*", r"\1", code)
    return code.strip()


def minify_html(html: str) -> str:
    # Remove comments (but keep conditional comments if any)
    html = re.sub(r"<!--(?!\s*\[if).*?-->", "", html, flags=re.S)
    # Update asset references to minified names
    html = html.replace('href="style.css"', 'href="style.min.css"')
    html = html.replace('src="index.js"', 'src="index.min.js"')
    # Collapse whitespace between tags
    html = re.sub(r">\s+<", "><", html)
    # Collapse multiple spaces
    html = re.sub(r"\s{2,}", " ", html)
    return html.strip()


def main():
    DIST.mkdir(exist_ok=True)

    # CSS
    if SRC_CSS.exists():
        css = SRC_CSS.read_text(encoding='utf-8')
        (DIST / 'style.min.css').write_text(minify_css(css), encoding='utf-8')

    # JS
    if SRC_JS.exists():
        js = SRC_JS.read_text(encoding='utf-8')
        (DIST / 'index.min.js').write_text(minify_js(js), encoding='utf-8')

    # HTML
    if SRC_HTML.exists():
        html = SRC_HTML.read_text(encoding='utf-8')
        (DIST / 'index.html').write_text(minify_html(html), encoding='utf-8')

    # Assets
    if SRC_IMG.exists():
        shutil.copy2(SRC_IMG, DIST / SRC_IMG.name)

    print('Minified assets written to', DIST)


if __name__ == '__main__':
    main()

