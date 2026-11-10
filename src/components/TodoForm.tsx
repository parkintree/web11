/**
 * TodoForm：录入行（受控组件）。
 *
 * · value 由 TodoApp 通过 props 传下来（数据向下传）；
 * · 输入变化调用 onChange、提交调用 onSubmit（事件向上传）；
 * · 本组件不直接改 todos，也不清空输入框——清空由父组件在新增成功后
 *   调用 setText('') 完成，保证「输入框内容」和「新增是否成功」只有一份真相。
 */

import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

export interface TodoFormProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
}

export function TodoForm({ value, onChange, onSubmit }: TodoFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    /* 中文输入法回车确认候选词时不应触发提交（与 W10 的 isComposing 判断一致）。 */
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      return;
    }
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    onSubmit();
  }

  function handleAddClick(): void {
    onSubmit();
    inputRef.current?.focus();
  }

  return (
    <div className="todo-form">
      <label className="sr-only" htmlFor="todo-input">
        待办内容
      </label>
      <input
        ref={inputRef}
        id="todo-input"
        className="todo-input"
        type="text"
        maxLength={120}
        autoComplete="off"
        placeholder="输入待办内容，按回车键或点击「添加」"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        id="todo-add"
        className="todo-add"
        type="button"
        onClick={handleAddClick}
      >
        添加
      </button>
    </div>
  );
}
