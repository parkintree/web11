/**
 * 把真实命令输出渲染成终端风格 PNG，作为协作记录中的截图证据。
 *
 * 用法：node scripts/render-terminal.mjs <标题> <输入文本> <输出 PNG>
 * 文本内容不做任何修改，只去掉 ANSI 颜色转义并做 HTML 转义。
 */

import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const [title = 'Terminal', input = '', output = 'docs/terminal.png',
  fontSize = '14'] = process.argv.slice(2);
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const raw = readFileSync(input, 'utf8')
  .replace(/\[[0-9;]*m/g, '')
  .replace(/\x1b\[[0-9;]*m/g, '')
  .trimEnd();

const escapeHtml = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; background: #111317; }
  body { padding: 18px; }
  .window {
    width: max-content;
    min-width: 780px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 18px 48px rgba(0,0,0,.55);
    border: 1px solid #2c313a;
  }
  .bar {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px;
    background: linear-gradient(#2a2f37, #232830);
    border-bottom: 1px solid #333a44;
  }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .dot.r { background: #ff5f57; }
  .dot.y { background: #febc2e; }
  .dot.g { background: #28c840; }
  .title {
    margin-left: 10px;
    color: #c9d1d9;
    font: 13px "Segoe UI", "Microsoft YaHei", sans-serif;
  }
  pre {
    margin: 0;
    padding: 18px 22px 22px;
    background: #0d1117;
    color: #d7dde5;
    font: ${fontSize}px/1.65 Consolas, "Cascadia Mono", "Microsoft YaHei", monospace;
    white-space: pre;
  }
  .prompt { color: #7ee787; }
</style>
</head>
<body>
<div class="window">
  <div class="bar">
    <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
    <span class="title">${escapeHtml(title)}</span>
  </div>
  <pre><span class="prompt">PS E:\\大三\\Web\\web11&gt;</span> ${escapeHtml(raw)}</pre>
</div>
</body>
</html>`;

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.locator('.window').screenshot({ path: output });
await browser.close();
console.log(`saved ${output}`);
