/**
 * 轨道 B：真实浏览器 UI 行为验证。
 *
 * 用 playwright-core 驱动本机 Edge（无需下载浏览器内核）：
 *   1) 起 Vite preview 提供生产构建产物；
 *   2) 每一步同时断言「页面呈现」与「window.__todoState」；
 *   3) 把逐项结果写进 docs/ui-verify.txt，并截取 docs/ui-todo.png。
 *
 * 运行前提：npm run build 已生成 dist/。
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { preview } from 'vite';

const PORT = 4173;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const results = [];

function record(name, expected, actual, pass) {
  results.push({ name, expected, actual, pass: Boolean(pass) });
  console.log(
    `${pass ? 'PASS' : 'FAIL'}  ${name}\n      期望: ${expected}\n      实际: ${actual}`,
  );
}

function same(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  record(name, e, a, a === e);
}

function includes(name, actual, keyword) {
  record(name, `包含「${keyword}」`, actual, String(actual).includes(keyword));
}

async function addByClick(page, text) {
  await page.locator('#todo-input').fill(text);
  await page.locator('#todo-add').click();
}

async function addByEnter(page, text) {
  await page.locator('#todo-input').fill(text);
  await page.locator('#todo-input').press('Enter');
}

async function getState(page) {
  return page.evaluate(() => window.__todoState ?? []);
}

async function main() {
  const server = await preview({
    configFile: resolve('vite.config.ts'),
    preview: { port: PORT, strictPort: true },
  });

  const browser = await chromium.launch({
    executablePath: EDGE,
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1200 },
    locale: 'zh-CN',
  });
  /* 只在本次会话的首次加载清空 localStorage；reload 时保留，才能验证恢复。 */
  await context.addInitScript(() => {
    if (window.sessionStorage.getItem('web11.cleared') === null) {
      window.localStorage.clear();
      window.sessionStorage.setItem('web11.cleared', '1');
    }
  });
  const page = await context.newPage();
  const stateLogs = [];
  page.on('console', (message) => {
    const text = message.text();
    if (text.includes('[TodoApp] todos')) {
      stateLogs.push(text);
    }
  });

  try {
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

    /* 0. 初始状态 */
    same('初始列表为空', await page.locator('#todo-list .todo-item').count(), 0);
    includes(
      '初始空状态文案',
      await page.locator('.todo-empty').first().textContent(),
      '暂无待办',
    );

    /* 1. 输入「任务A」，点击添加 */
    await addByClick(page, '任务A');
    same('点击添加后输入框清空', await page.locator('#todo-input').inputValue(), '');
    same('点击添加后列表多一项', await page.locator('#todo-list .todo-item').count(), 1);
    same('State 同步新增一项', (await getState(page)).map((t) => t.text), ['任务A']);

    /* 2. 回车添加「任务B」 */
    await addByEnter(page, '任务B');
    same('回车添加后列表为两项', await page.locator('#todo-list .todo-item').count(), 2);
    same(
      'State 顺序为新项在前',
      (await getState(page)).map((t) => t.text),
      ['任务B', '任务A'],
    );

    /* 3. 控制台 state 与页面文本一致 */
    const domTexts = await page.locator('#todo-list .todo-text').allTextContents();
    same(
      '页面列表与 todos 数组逐项一致',
      domTexts,
      (await getState(page)).map((t) => t.text),
    );

    /* 4. 点击任务A的完成按钮 */
    const itemA = page.locator('#todo-list .todo-item', { hasText: '任务A' });
    await itemA.locator('.todo-toggle').click();
    const decoration = await itemA
      .locator('.todo-text')
      .evaluate((el) => getComputedStyle(el).textDecorationLine);
    includes('任务A 文字出现删除线', decoration, 'line-through');
    same(
      'State 中任务A completed = true',
      (await getState(page)).find((t) => t.text === '任务A')?.completed,
      true,
    );
    includes(
      '条目获得 is-completed 类',
      await itemA.getAttribute('class'),
      'is-completed',
    );

    /* 5. 点击任务A的删除按钮 */
    await itemA.locator('.todo-remove').click();
    same('删除后列表少一项', await page.locator('#todo-list .todo-item').count(), 1);
    same(
      '删除后 State 同步少一项',
      (await getState(page)).map((t) => t.text),
      ['任务B'],
    );

    /* 6. 业务规则回归：重复 / 空 / 超长 */
    await addByClick(page, '任务B');
    includes(
      '重复内容被拦截',
      await page.locator('.todo-tip').textContent(),
      '该待办已存在',
    );
    same('重复内容不新增', await page.locator('#todo-list .todo-item').count(), 1);

    await addByClick(page, '   ');
    includes(
      '纯空白被拦截',
      await page.locator('.todo-tip').textContent(),
      '内容不能为空',
    );
    same('纯空白不新增', await page.locator('#todo-list .todo-item').count(), 1);

    await addByClick(page, 'a'.repeat(61));
    includes(
      '超长内容被拦截',
      await page.locator('.todo-tip').textContent(),
      '内容过长',
    );
    same('超长内容不新增', await page.locator('#todo-list .todo-item').count(), 1);

    /* 7. 筛选与统计 */
    await addByClick(page, '任务C');
    const itemC = page.locator('#todo-list .todo-item', { hasText: '任务C' });
    await itemC.locator('.todo-toggle').click();
    await page.locator('.todo-filter[data-filter="completed"]').click();
    same(
      '已完成筛选只显示已完成项',
      await page.locator('#todo-list .todo-text').allTextContents(),
      ['任务C'],
    );
    same(
      '已完成筛选按钮 aria-pressed',
      await page
        .locator('.todo-filter[data-filter="completed"]')
        .getAttribute('aria-pressed'),
      'true',
    );
    same(
      '未完成计数与 State 一致',
      await page.locator('.todo-filter[data-filter="active"] .todo-count').textContent(),
      String((await getState(page)).filter((t) => !t.completed).length),
    );
    await page.locator('.todo-filter[data-filter="all"]').click();

    /* 8. 刷新后从 localStorage 恢复 */
    await page.reload({ waitUntil: 'networkidle' });
    same(
      '刷新后从 localStorage 恢复',
      await page.locator('#todo-list .todo-text').allTextContents(),
      ['任务C', '任务B'],
    );
    same(
      '刷新后完成状态保留',
      (await getState(page)).find((t) => t.text === '任务C')?.completed,
      true,
    );

    /* 9. 再补一条，截取页面证据 */
    await addByClick(page, '任务D');
    await page.locator('#todo-input').blur();

    const finalState = await getState(page);
    const finalDom = await page.locator('#todo-list .todo-text').allTextContents();
    const stateSnapshot = [
      `页面列表：${JSON.stringify(finalDom)}`,
      `window.__todoState：${JSON.stringify(finalState)}`,
      '',
      '控制台最后 3 条 [TodoApp] todos 日志：',
      ...stateLogs.slice(-3).map((line) => `  ${line}`),
    ].join('\n');
    writeFileSync('docs/ui-state.txt', stateSnapshot + '\n', 'utf8');

    await page.screenshot({
      path: 'docs/ui-fullpage.png',
      fullPage: true,
    });
    await page.locator('section.todo').screenshot({
      path: 'docs/ui-todo.png',
    });
    await page.screenshot({
      path: 'docs/ui-viewport.png',
    });
  } finally {
    await browser.close();
    await new Promise((done) => server.httpServer.close(done));
  }

  const failed = results.filter((row) => !row.pass);
  const lines = [
    '轨道 B：真实浏览器 UI 行为验证（Edge headless + Vite preview）',
    `时间：${new Date().toLocaleString('zh-CN')}`,
    `结果：${results.length - failed.length}/${results.length} 通过`,
    '',
  ];
  for (const [index, row] of results.entries()) {
    lines.push(
      `${String(index + 1).padStart(2, '0')}. [${row.pass ? 'PASS' : 'FAIL'}] ${row.name}`,
      `    期望: ${row.expected}`,
      `    实际: ${row.actual}`,
    );
  }
  writeFileSync('docs/ui-verify.txt', lines.join('\n') + '\n', 'utf8');

  console.log(`\n结果：${results.length - failed.length}/${results.length} 通过`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
