/**
 * 任务 3：AI 修复后的组件核心片段（与 task3-ai-fixed.ts 配套）。
 *
 * 与靶子代码的关键差异：
 *   1. 删除 let listRef / push / innerHTML 全部 DOM 操作；
 *   2. 新增改为函数式 setTodos(prev => [新项, ...prev])，传的是新数组；
 *   3. 切换改为 map + 展开运算符，返回新数组、新对象；
 *   4. 列表完全由 JSX 的 todos.map 渲染，不再手工往 ul 里塞 li。
 *
 * 该片段只作审查证据，不参与项目构建；项目最终版本见 src/components/。
 */

import { useState } from 'react';
import { addTodo, toggleTodo } from './task3-ai-fixed';
import type { Todo } from './task3-ai-fixed';

export function TodoApp() {
  const [todos, setTodos] = useState<readonly Todo[]>([]);
  const [text, setText] = useState('');

  function handleAdd(): void {
    const value = text.trim();
    if (value === '') {
      return;
    }
    setTodos((prev) => addTodo(prev, text, Date.now()));
    setText('');
  }

  function handleToggle(id: number): void {
    setTodos((prev) => toggleTodo(prev, id));
  }

  return (
    <div>
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <button onClick={handleAdd}>添加</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => handleToggle(todo.id)}>
            {todo.text} {todo.completed ? '✔' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
