# 任务 3 的结构化 Prompt

```text
# 角色
你是资深 React 19 + TypeScript 前端工程师，熟悉不可变数据与函数式 setState。

# 上下文
项目已完成 V3.0 的 React 组件化改造，数据层 todo-core.ts 有 41 条 Vitest 用例。
下面这段 TodoApp 是典型的「假 React」：它虽然写了 useState，
但仍在原地修改数组、把同一引用传给 setState，并混用 innerHTML 手动改 DOM。

# 任务
把这段代码改成符合 React 规范的版本：
让 state 成为唯一数据源，列表完全由 JSX 渲染，所有更新不可变。

# 硬约束（违反任意一条即视为失败）
1. 不改业务行为：空文本/纯空白不能新增；新项置顶；未完成 ⇄ 已完成双向切换。
2. 禁止 push / splice / sort / reverse / 直接改对象属性等原地修改。
3. 禁止把同一个数组引用传给 setState；每次更新必须产生新数组。
4. 禁止 getElementById / querySelector / innerHTML / appendChild 等命令式 DOM 操作。
5. 使用函数式 setState(prev => next)，避免闭包里的旧 state。
6. 列表只用 todos.map 渲染，key 使用稳定业务 id。
7. 不使用 any、as any、@ts-ignore、eslint-disable。
8. 抽取纯函数（新增 / 切换）以便单独审查和单测，纯函数不得读组件状态。

# 允许的改造手段
· 展开运算符生成新数组 / 新对象；
· map 返回新对象替换命中项，未命中项保持原引用；
· 把校验逻辑抽成纯函数。

# 输出格式
1. 修改后的完整组件（含纯函数）；
2. 逐条说明每个「假 React 坑」由哪段代码修掉；
3. 明确列出你无法在约束内解决、需要人类决定的问题，不要偷偷绕过。

# 自检清单
- [ ] 源码中没有 push / innerHTML / getElementById？
- [ ] 两次 setState 的返回值是否都是新数组？
- [ ] toggle 是否没有修改原对象？
- [ ] 空文本、置顶、双向切换三条规则是否仍成立？
```
