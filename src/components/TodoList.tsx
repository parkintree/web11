/**
 * TodoList：只负责把 todos 数组映射成 TodoItem 列表。
 *
 * 列表内容完全由 props 决定，内部没有 DOM 查询、没有手动 appendChild：
 * 增删改之后只要父组件给出新数组，React 就会按 key 做最小化更新。
 * key 使用业务 id（number），与 todo-core 的 id 规则一致。
 */

import type { Todo } from '../types';
import { TodoItem } from './TodoItem';

export interface TodoListProps {
  readonly todos: readonly Todo[];
  readonly onToggle: (id: number) => void;
  readonly onEdit: (id: number) => void;
  readonly onDelete: (id: number) => void;
}

export function TodoList({
  todos,
  onToggle,
  onEdit,
  onDelete,
}: TodoListProps) {
  return (
    <ul id="todo-list" className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
