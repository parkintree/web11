# 任务 3：AI 修复后的核心片段

```tsx
function handleAdd(): void {
  const value = text.trim();
  if (value === '') return;

  setTodos((prev) => [
    { id: Date.now(), text, completed: false },
    ...prev,
  ]);
  setText('');
}

function handleToggle(id: number): void {
  setTodos((prev) =>
    prev.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    ),
  );
}

// 列表完全由 JSX 渲染，不再操作 innerHTML
<ul>
  {todos.map((todo) => (
    <li key={todo.id} onClick={() => handleToggle(todo.id)}>
      {todo.text} {todo.completed ? '✔' : ''}
    </li>
  ))}
</ul>
```
