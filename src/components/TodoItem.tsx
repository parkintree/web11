/**
 * TodoItem：单条待办（展示 + 三个交互出口）。
 *
 * 职责边界：
 *   · 自己不持有任何状态，也不修改 todo 对象；
 *   · 用户操作只通过 onToggle / onEdit / onDelete 三个回调向上冒泡，
 *     真正的数据变更由 TodoApp 调用 todo-core 的纯函数完成。
 *
 * todo 的字段均为 readonly，配合 Props 的 readonly 声明，
 * 在类型层面就杜绝了「在子组件里改数据」的假 React 写法。
 */

import type { Todo } from '../types';

export interface TodoItemProps {
  readonly todo: Todo;
  readonly onToggle: (id: number) => void;
  readonly onEdit: (id: number) => void;
  readonly onDelete: (id: number) => void;
}

export function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
}: TodoItemProps) {
  const className = todo.completed ? 'todo-item is-completed' : 'todo-item';

  return (
    <li className={className} data-id={todo.id}>
      <label className="todo-check">
        <input
          type="checkbox"
          className="todo-toggle"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <span className="todo-text">{todo.text}</span>
      </label>

      <button
        type="button"
        className="todo-edit"
        data-action="edit"
        aria-label={`编辑待办：${todo.text}`}
        onClick={() => onEdit(todo.id)}
      >
        编辑
      </button>

      <button
        type="button"
        className="todo-remove"
        data-action="delete"
        aria-label={`删除待办：${todo.text}`}
        onClick={() => onDelete(todo.id)}
      >
        <span className="todo-remove-icon" aria-hidden="true">
          ×
        </span>
      </button>
    </li>
  );
}
