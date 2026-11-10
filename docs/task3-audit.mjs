/**
 * 任务 3 审查脚本：验证 AI 修复后「原业务规则是否仍在」，
 * 同时复现两处未被 AI 修掉的残留问题。
 *
 * 运行：node docs/task3-audit.mjs
 * 依赖：Node 22.18+ 的 TypeScript 类型擦除（可直接 import .ts）。
 */

import { addTodo, toggleTodo } from './task3-ai-fixed.ts';

const rows = [];

function check(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  rows.push({ name, expected: JSON.stringify(expected), actual: JSON.stringify(actual), pass });
}

/* ---- 业务规则：原规则是否仍然成立 ---- */
const empty = [];
check('空字符串被拦截且返回原数组', addTodo(empty, '', 1) === empty, true);
check('纯空白被拦截且返回原数组', addTodo(empty, ' \t　 ', 1) === empty, true);

const added = addTodo(empty, '任务A', 1);
check('正常新增：长度 +1', added.length, 1);
check('新增项默认未完成', added[0].completed, false);
check('新增后原数组未被修改', empty.length, 0);

const two = addTodo(added, '任务B', 2);
check('新项置顶，原有顺序不变', two.map((t) => t.text), ['任务B', '任务A']);

const toggled = toggleTodo(two, 1);
check('切换命中项：completed 反转', toggled[1].completed, true);
check('切换返回新数组', toggled !== two, true);
check('切换未修改原对象', two[1].completed, false);
check('切换未命中项保持原引用', toggled[0] === two[0], true);

/* ---- 残留问题 1：Date.now() 同毫秒新增会产生重复 id ---- */
const sameMs = 1730000000000;
const collision = addTodo(addTodo([], '任务A', sameMs), '任务B', sameMs);
check(
  '残留：同一毫秒新增两条 → id 重复（React key 冲突）',
  collision.map((t) => t.id),
  [sameMs, sameMs],
);

/* ---- 残留问题 2：判空用 trim，入库却是原始文本 ---- */
const spaced = addTodo([], '  任务A  ', 1);
check('残留：首尾空白被原样存入 state', spaced[0].text, '  任务A  ');

/* ---- 输出 ---- */
const failed = rows.filter((r) => !r.pass);
console.log('任务 3 审查：AI 修复结果的业务行为与残留问题\n');
for (const [i, row] of rows.entries()) {
  console.log(`${String(i + 1).padStart(2, '0')}. [${row.pass ? 'PASS' : 'FAIL'}] ${row.name}`);
  console.log(`    期望: ${row.expected}`);
  console.log(`    实际: ${row.actual}`);
}
console.log(`\n合计：${rows.length - failed.length}/${rows.length} 通过`);

const { writeFileSync } = await import('node:fs');
writeFileSync(
  'docs/task3-audit.txt',
  [
    '任务 3 审查：AI 修复结果的可运行验证',
    `时间：${new Date().toLocaleString('zh-CN')}`,
    `结果：${rows.length - failed.length}/${rows.length} 通过`,
    '',
    ...rows.flatMap((row, i) => [
      `${String(i + 1).padStart(2, '0')}. [${row.pass ? 'PASS' : 'FAIL'}] ${row.name}`,
      `    期望: ${row.expected}`,
      `    实际: ${row.actual}`,
    ]),
  ].join('\n') + '\n',
  'utf8',
);

if (failed.length > 0) {
  process.exitCode = 1;
}
