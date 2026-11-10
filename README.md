# Web W11 · 待办清单 V4.0（React 组件化重构）

在 W10 已验证的 `todo-core.ts` 纯函数数据层之上，把原生 DOM 版 Todo
重构为 React 组件，并完成「单测回归 + 真浏览器 UI 行为」双轨验证。

## 目录结构

```
index.html                    简历页；待办模块只保留 #todo-root 挂载点
src/
  main.tsx                    入口：createRoot(#todo-root) + StrictMode
  components/
    TodoApp.tsx               唯一状态容器：todos / filter / text / tip
    TodoForm.tsx              受控录入行：onChange / onSubmit 事件向上
    TodoList.tsx              todos → TodoItem[] 纯映射
    TodoItem.tsx              单条展示：onToggle / onEdit / onDelete 回调
  todo-core.ts                沿用 W10 纯函数数据层（校验、增删改、脏数据恢复）
  types.ts                    Todo / TodoFilter / StorageLike
  style.css                   简历 + 待办样式；#todo-root 用 display: contents
tests/
  todo-core.handwritten.test.ts   手写单测 19 条
  todo-core.ai-patched.test.ts    审查后补齐 22 条
scripts/
  ui-verify.mjs               playwright-core 驱动 Edge 的 24 项 UI 验证
  render-terminal.mjs         把真实命令输出渲染为截图证据
  build_w11_docx.py           由模板生成最终协作日志 docx（代码块 / 表格 / 截图）
  preview_docx.py             导出 PDF 并逐页渲染 PNG，检查分页版式
docs/                         验证输出、截图、任务 3 的 Prompt 与审查材料
```

## 运行

```bash
npm install
npm run dev         # 开发服务器
npm run build       # tsc --noEmit && vite build
npm test            # vitest run，41 条
npm run ui:verify   # 需先 build；启动 preview + Edge，24 项 UI 验证
npm run verify      # build + test
```

## 双轨验证

- 轨道 A：`npm test`，41/41 通过。数据层未改，组件通过
  `setTodos(addTodo(todos, text, id).todos)` 组合调用纯函数。
- 轨道 B：`npm run ui:verify`，24/24 通过。每一步同时断言页面 DOM 与
  `window.__todoState`；结果见 `docs/ui-verify.txt`，截图见 `docs/ui-todo.png`。
- 源码自查：`src/components/` 内 `document.querySelector` /
  `getElementById` / `innerHTML` / `push` / `splice` 均为 0 处；
  唯一命令式查询是 `src/main.tsx` 的挂载点。
