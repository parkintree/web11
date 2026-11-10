/**
 * 任务 3：AI 对「假 React」靶子代码的修复结果（抽取出的纯逻辑部分）。
 *
 * 这三处是本次修复的核心：
 *   · addTodo 用展开运算符返回新数组，不再 push；
 *   · toggleTodo 用 map 返回新数组、用展开运算符生成新对象，不再原地改；
 *   · 函数都是纯函数，输入输出为普通数据，可单独审查。
 *
 * 注意：以下两处是本次审查发现的残留问题，已在此如实保留，
 * 便于在审查报告中用可运行脚本复现（见 task3-audit.mjs）：
 *   1) id 仍由调用方用 Date.now() 生成，同一毫秒内连续新增会产生重复 key；
 *   2) 判空用的是 trim 后的值，但存入 state 的是原始 rawText，
 *      首尾空白会进入数据层（与项目 todo-core 的 normalizeText 规则不一致）。
 */

export interface Todo {
  readonly id: number;
  readonly text: string;
  readonly completed: boolean;
}

export function addTodo(
  todos: readonly Todo[],
  rawText: string,
  id: number,
): readonly Todo[] {
  const value = rawText.trim();
  if (value === '') {
    return todos;
  }
  const newTodo: Todo = { id, text: rawText, completed: false };
  return [newTodo, ...todos];
}

export function toggleTodo(
  todos: readonly Todo[],
  id: number,
): readonly Todo[] {
  return todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  );
}
