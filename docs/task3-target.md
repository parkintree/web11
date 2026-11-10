# 任务 3 靶子代码（原始「假 React」版本）

```tsx
function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  let listRef = [];

  function handleAdd() {
    if (text.trim() === '') return;
    const newTodo = { id: Date.now(), text, completed: false };
    listRef = todos;
    listRef.push(newTodo);
    setTodos(listRef);
    const listEl = document.getElementById('todo-list');
    if (listEl) {
      listEl.innerHTML += `<li>${newTodo.text}</li>`;
    }
    setText('');
  }

  function handleToggle(id) {
    todos.map((t) => {
      if (t.id === id) {
        t.completed = !t.completed;
      }
    });
    setTodos(todos);
  }

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleAdd}>添加</button>
      <ul id="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => handleToggle(todo.id)}>
            {todo.text} {todo.completed ? '✔' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
```
