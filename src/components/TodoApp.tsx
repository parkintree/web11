/**
 * TodoApp：唯一持有 todos 状态的容器组件。
 *
 * V4.0 的数据流：
 *   todos (useState) ──props──▶ TodoList ──props──▶ TodoItem
 *   TodoForm / TodoItem 的用户操作 ──回调──▶ TodoApp ──▶ todo-core 纯函数
 *   ──setTodos(新数组)──▶ 重新渲染
 *
 * 三条不可变更新约定（对应任务 1）：
 *   · 新增：setTodos(addTodo(todos, text, id).todos)      头部插入新数组
 *   · 切换：setTodos(toggleTodo(todos, id).todos)         只替换命中项
 *   · 删除：setTodos(removeTodo(todos, id).todos)         返回 filter 后的新数组
 * 组件内部没有 push / splice / 直接改对象，也没有任何 DOM 查询。
 *
 * 业务规则不在这里重写：校验、去重、id 合法性、脏数据恢复全部复用
 * W10 已验证的 todo-core.ts，因此原有 41 条单测可直接作为回归基线。
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FILTERS,
  MAX_LEN,
  addTodo,
  editTodo,
  getTodoStats,
  getVisibleTodos,
  loadTodos,
  nextTodoId,
  removeTodo,
  saveTodos,
  toggleTodo,
} from '../todo-core';
import type {
  StorageLike,
  Todo,
  TodoFailureReason,
  TodoFilter,
  TodoStats,
} from '../todo-core';
import { TodoForm } from './TodoForm';
import { TodoList } from './TodoList';

const STORAGE_KEY = 'web11.todos.v1';
const TIP_DURATION = 2400;

const FILTER_LABELS: Record<TodoFilter, string> = {
  all: '全部',
  active: '未完成',
  completed: '已完成',
};

const EMPTY_MESSAGES: Record<TodoFilter, string> = {
  all: '暂无待办，输入内容后点击「添加」或按回车键即可新增。',
  active: '没有未完成的待办，给自己放个小假吧。',
  completed: '还没有已完成的待办，勾选左侧方框即可标记完成。',
};

const FAILURE_MESSAGES: Record<TodoFailureReason, string> = {
  empty: '内容不能为空，请输入待办事项。',
  'too-long': `内容过长，最多 ${MAX_LEN} 字，请精简后重试。`,
  duplicate: '该待办已存在，无需重复添加。',
  'invalid-id': '待办编号无效，本次操作已取消。',
  'not-found': '该待办不存在或已被删除。',
};

/* 控制台验证桥：UI 行为验证时读取同一份 state，确认页面与数据一致。 */
declare global {
  interface Window {
    __todoState?: readonly Todo[];
  }
}

function messageFor(reason: TodoFailureReason): string {
  return FAILURE_MESSAGES[reason];
}

function getStorage(): StorageLike | null {
  try {
    const local = window.localStorage;
    /* 隐私模式下 localStorage 可能「存在但不可写」，先探测一次写入。 */
    const probeKey = 'web11.storage-probe';
    local.setItem(probeKey, '1');
    local.removeItem(probeKey);
    return local;
  } catch {
    return null;
  }
}

function countOf(filter: TodoFilter, stats: TodoStats): number {
  if (filter === 'active') {
    return stats.active;
  }
  if (filter === 'completed') {
    return stats.completed;
  }
  return stats.total;
}

export function TodoApp() {
  const [storage] = useState<StorageLike | null>(() => getStorage());
  const [todos, setTodos] = useState<readonly Todo[]>(
    () => loadTodos(storage, STORAGE_KEY).todos,
  );
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [tip, setTip] = useState('');

  const hydrated = useRef(false);

  const visibleTodos = useMemo(
    () => getVisibleTodos(todos, filter),
    [todos, filter],
  );
  const stats = useMemo(() => getTodoStats(todos), [todos]);

  /* 提示条 2.4 秒后自动消失；卸载或新提示到来时清掉旧定时器。 */
  useEffect(() => {
    if (tip === '') {
      return undefined;
    }
    const timer = window.setTimeout(() => setTip(''), TIP_DURATION);
    return () => window.clearTimeout(timer);
  }, [tip]);

  /* 首次渲染只做恢复，不把恢复结果再写回存储；之后 todos 变化才持久化。 */
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    if (!saveTodos(storage, STORAGE_KEY, todos)) {
      setTip('浏览器本地存储不可用，刷新后本次修改会丢失。');
    }
  }, [storage, todos]);

  /* 把当前 state 打到控制台，并挂到 window 供双轨验证读取。 */
  useEffect(() => {
    console.info('[TodoApp] todos =', todos);
    window.__todoState = todos;
  }, [todos]);

  function handleSubmit(): void {
    const id = nextTodoId(todos);
    if (id === null) {
      setTip('待办编号已用尽，无法继续新增。');
      return;
    }

    const result = addTodo(todos, text, id);
    if (!result.ok) {
      setTip(messageFor(result.reason));
      return;
    }

    setTodos(result.todos); // 新数组：不 push、不改原对象
    setText('');
    setTip('');
  }

  function handleToggle(id: number): void {
    const result = toggleTodo(todos, id);
    if (!result.ok) {
      setTip(messageFor(result.reason));
      return;
    }
    setTodos(result.todos);
  }

  function handleDelete(id: number): void {
    const result = removeTodo(todos, id);
    if (!result.ok) {
      setTip(messageFor(result.reason));
      return;
    }
    setTodos(result.todos);
    setTip('已删除一条待办。');
  }

  function handleEdit(id: number): void {
    const current = todos.find((todo) => todo.id === id);
    if (current === undefined) {
      setTip(messageFor('not-found'));
      return;
    }

    const raw = window.prompt('修改待办内容：', current.text);
    if (raw === null) {
      return;
    }

    const result = editTodo(todos, id, raw);
    if (!result.ok) {
      setTip(messageFor(result.reason));
      return;
    }
    setTodos(result.todos);
    setTip('已修改待办。');
  }

  return (
    <>
      <TodoForm value={text} onChange={setText} onSubmit={handleSubmit} />

      <p className="todo-tip" role="status" aria-live="polite">
        {tip}
      </p>

      <div className="todo-toolbar">
        <div
          className="todo-filters"
          role="group"
          aria-label="按完成状态筛选待办"
        >
          {FILTERS.map((candidate) => (
            <button
              key={candidate}
              className="todo-filter"
              type="button"
              data-filter={candidate}
              aria-pressed={filter === candidate}
              onClick={() => setFilter(candidate)}
            >
              {FILTER_LABELS[candidate]}{' '}
              <span className="todo-count">
                {countOf(candidate, stats)}
              </span>
            </button>
          ))}
        </div>
        <p className="todo-summary" aria-live="polite">
          共 {stats.total} 条 · 未完成 {stats.active} 条
        </p>
      </div>

      <TodoList
        todos={visibleTodos}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <p className="todo-empty">{EMPTY_MESSAGES[filter]}</p>
    </>
  );
}
