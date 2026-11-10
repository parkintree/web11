# -*- coding: utf-8 -*-
"""把第11周AI协作记录.docx 模板填充为最终协作日志（含截图与代码块）。"""

from pathlib import Path
import re

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from docx.text.paragraph import Paragraph

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "第11周AI协作记录.docx"
OUTPUT = ROOT / "张衡 2024150167 AI协作日志W11.docx"

BODY_SIZE = 10.5
CODE_SIZE = 8.5
TABLE_SIZE = 9.2
GRAY = RGBColor(0x59, 0x63, 0x6E)
GREEN = RGBColor(0x0B, 0x7A, 0x0B)
RED = RGBColor(0xC0, 0x39, 0x2B)


# ---------------------------------------------------------------- 基础工具

def clear_runs(paragraph: Paragraph) -> None:
    for run in list(paragraph.runs):
        run._element.getparent().remove(run._element)


def style_run(run, size=BODY_SIZE, bold=False, italic=False,
              name="Calibri", east="Microsoft YaHei", color=None):
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.name = name
    if color is not None:
        run.font.color.rgb = color
    r_pr = run._element.get_or_add_rPr()
    r_fonts = r_pr.find(qn("w:rFonts"))
    if r_fonts is None:
        r_fonts = OxmlElement("w:rFonts")
        r_pr.insert(0, r_fonts)
    r_fonts.set(qn("w:ascii"), name)
    r_fonts.set(qn("w:hAnsi"), name)
    r_fonts.set(qn("w:eastAsia"), east)


def set_text(paragraph: Paragraph, text, bold=False, size=BODY_SIZE,
             color=None, align=None):
    clear_runs(paragraph)
    run = paragraph.add_run(text)
    style_run(run, size=size, bold=bold, color=color)
    if align is not None:
        paragraph.alignment = align


def set_parts(paragraph: Paragraph, parts, size=BODY_SIZE):
    """parts: [(text, bold), ...]"""
    clear_runs(paragraph)
    for text, bold in parts:
        run = paragraph.add_run(text)
        style_run(run, size=size, bold=bold)


def insert_after(anchor: Paragraph, text="", style=None, size=BODY_SIZE,
                 bold=False) -> Paragraph:
    new_p = OxmlElement("w:p")
    anchor._p.addnext(new_p)
    para = Paragraph(new_p, anchor._parent)
    if style is not None:
        para.style = style
    if text:
        run = para.add_run(text)
        style_run(run, size=size, bold=bold)
    return para


def delete_paragraph(paragraph: Paragraph) -> None:
    paragraph._p.getparent().remove(paragraph._p)


def add_bullets_after(anchor: Paragraph, bullets):
    last = anchor
    for parts in bullets:
        para = insert_after(last, style="List Bullet")
        para.paragraph_format.space_after = Pt(1)
        for text, bold in parts:
            run = para.add_run(text)
            style_run(run, size=BODY_SIZE, bold=bold)
        last = para
    return last


def add_paragraphs_after(anchor: Paragraph, texts, bold_first=False):
    last = anchor
    for index, text in enumerate(texts):
        para = insert_after(last, text, size=BODY_SIZE,
                            bold=(bold_first and index == 0))
        para.paragraph_format.space_after = Pt(2)
        last = para
    return last


def shade_paragraph(paragraph: Paragraph, fill="F4F6F8"):
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = OxmlElement("w:pBdr")
    for edge in ("top", "left", "bottom", "right"):
        element = OxmlElement(f"w:{edge}")
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "4")
        element.set(qn("w:space"), "3")
        element.set(qn("w:color"), "D0D7DE")
        p_bdr.append(element)
    p_pr.append(p_bdr)
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    p_pr.append(shd)


def replace_with_code(anchor: Paragraph, code: str) -> Paragraph:
    code = code.strip("\n")
    clear_runs(anchor)
    shade_paragraph(anchor)
    fmt = anchor.paragraph_format
    fmt.space_before = Pt(2)
    fmt.space_after = Pt(3)
    fmt.line_spacing = 1.0
    fmt.left_indent = Inches(0.06)
    fmt.right_indent = Inches(0.06)
    fmt.keep_together = True  # 代码块整体不跨页

    lines = code.split("\n")
    run = anchor.add_run(lines[0])
    for line in lines[1:]:
        run.add_break()
        run.add_text(line)
    style_run(run, size=CODE_SIZE, name="Consolas", east="Microsoft YaHei",
              color=RGBColor(0x24, 0x29, 0x2F))
    return anchor


def replace_with_image(anchor: Paragraph, image: Path, caption: str,
                       width=5.5) -> Paragraph:
    clear_runs(anchor)
    anchor.alignment = WD_ALIGN_PARAGRAPH.CENTER
    anchor.paragraph_format.space_before = Pt(4)
    anchor.paragraph_format.space_after = Pt(2)
    run = anchor.add_run()
    run.add_picture(str(image), width=Inches(width))

    cap = insert_after(anchor, caption, size=9.0)
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_before = Pt(0)
    cap.paragraph_format.space_after = Pt(8)
    for run in cap.runs:
        run.font.color.rgb = GRAY
        run.italic = True
    return cap


def fill_cell(cell, text, bold=False, size=TABLE_SIZE, code=False,
              color=None):
    para = cell.paragraphs[0]
    clear_runs(para)
    para.paragraph_format.space_after = Pt(1)
    para.paragraph_format.line_spacing = 1.05
    run = para.add_run(text)
    style_run(
        run,
        size=size,
        bold=bold,
        name="Consolas" if code else "Calibri",
        east="Microsoft YaHei",
        color=color,
    )


def heading(paragraph: Paragraph, text=None, size=12.5):
    if text is None:
        text = paragraph.text
    set_text(paragraph, text, bold=True, size=size)
    for run in paragraph.runs:
        style_run(run, size=size, bold=True, name="Arial")


# ---------------------------------------------------------------- 打开模板

doc = Document(str(TEMPLATE))

# 按 body 顺序收集「段落 + 表格」，索引与模板检查时的 P00–P112 一致。
# 注意：doc.paragraphs 会跳过表格，索引会错位，不能直接用。
from docx.table import Table  # noqa: E402

blocks = []
for child in doc.element.body.iterchildren():
    if child.tag == qn("w:p"):
        blocks.append(Paragraph(child, doc))
    elif child.tag == qn("w:tbl"):
        blocks.append(Table(child, doc))
paras = blocks  # 先固定引用，后续插入不影响索引

# 标题与抬头
set_text(paras[0], "AI 协作日志 W11", bold=True, size=19,
         align=WD_ALIGN_PARAGRAPH.CENTER)
for run in paras[0].runs:
    style_run(run, size=19, bold=True, name="Arial")

set_text(paras[1], "文件命名：张衡 2024150167 AI协作日志W11.docx",
         size=9.0, color=GRAY)

set_parts(paras[2], [("姓名：", True), ("张衡", False)])
set_parts(paras[3], [("学号：", True), ("2024150167", False)])
set_parts(paras[4], [("使用的AI工具及方式：", True),
                     ("Claude Code + DeepSeek（结构化 Prompt：约束 → 生成 → 审查 → 验证）", False)])
set_parts(paras[5], [("Git 仓库链接：", True),
                     ("https://github.com/parkintree/web11", False)])
set_parts(paras[7], [("任务：", True),
                     ("完成 V4.0 的 React 组件重构与验证。包括：", False)])

# 主标题与子标题加粗
for index in (12, 29, 51, 111):
    heading(paras[index], size=12.5)
for index in (14, 16, 18, 19, 21, 24, 27, 31, 36, 37, 43, 49, 54, 95,
              97, 100, 101, 104, 108):
    for run in paras[index].runs:
        style_run(run, size=10.5, bold=True)
for index in (2, 3, 4, 5, 7):
    for run in paras[index].runs:
        style_run(run, size=10.5, bold=bool(run.bold))

# 代码块前的小标题：收紧段后距，避免「标题孤零零留在页底」
for index in (19, 21):
    paras[index].paragraph_format.space_after = Pt(3)

# 避免标题 / 代码块 / 表格被分页拆开
for index in (12, 26, 28, 41, 43, 50, 51, 59, 60, 67, 69, 72, 74,
              76, 80, 91, 95, 101, 104, 108):
    paras[index].paragraph_format.keep_with_next = True

# ---------------------------------------------------------------- 任务 1

set_text(paras[15], "重构组件结构：", bold=True)
last = paras[15]
paras[15].style = doc.styles["List Bullet"]
run = paras[15].add_run(
    "TodoApp 作为唯一状态容器；TodoForm 受控录入；TodoList 纯映射；"
    "TodoItem 单条展示。"
)
style_run(run)
last = add_bullets_after(last, [
    [("保留数据层：", True),
     ("继续使用 W10 的 todo-core.ts 纯函数，组件只调用 addTodo / toggleTodo / "
      "removeTodo / editTodo，并用 setTodos(新数组) 更新。", False)],
    [("改造工程入口：", True),
     ("接入 React 19 + @vitejs/plugin-react；main.tsx 用 createRoot 挂载 "
      "#todo-root；index.html 只保留挂载点。", False)],
    [("兼容原布局：", True),
     ("给 #todo-root 加 display: contents，让组件节点继续参与 "
      ".section.todo 的 Grid 栅格。", False)],
])

set_text(paras[17], "核对数据流：", bold=True)
paras[17].style = doc.styles["List Bullet"]
run = paras[17].add_run("确认 props 向下传、回调向上传，子组件不持有 todos，也不修改 props。")
style_run(run)
add_bullets_after(paras[17], [
    [("检查不可变更新：", True),
     ("新增 / 切换 / 删除都调用纯函数返回的新数组，组件内没有 push、splice "
      "或直接改对象。", False)],
    [("设计持久化：", True),
     ("用 useEffect 保存 todos，并用 ref 跳过首次渲染，避免覆盖 localStorage "
      "的恢复结果。", False)],
    [("完善交互细节：", True),
     ("处理中文输入法回车、按钮点击后焦点回到输入框、筛选按钮 aria-pressed "
      "同步。", False)],
    [("验收：", True),
     ("实跑 npm run build、npm test 和真浏览器 UI 验证，整理截图与输出。", False)],
])

TASK1_CODE = r'''
const [todos, setTodos] = useState<readonly Todo[]>(
  () => loadTodos(storage, STORAGE_KEY).todos,
);
const [filter, setFilter] = useState<TodoFilter>('all');
function handleSubmit(): void {
  const id = nextTodoId(todos);
  if (id === null) return;

  const result = addTodo(todos, text, id);
  if (!result.ok) {
    setTip(messageFor(result.reason));
    return;
  }

  setTodos(result.todos); // 新数组：不 push、不改原对象
  setText('');
}

function handleToggle(id: number): void {
  const result = toggleTodo(todos, id);
  if (!result.ok) return;
  setTodos(result.todos);
}

function handleDelete(id: number): void {
  const result = removeTodo(todos, id);
  if (!result.ok) return;
  setTodos(result.todos);
  setTip('已删除一条待办。');
}
'''
replace_with_code(paras[20], TASK1_CODE)

PROPS_CODE = r'''
export interface TodoFormProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
}

export interface TodoListProps {
  readonly todos: readonly Todo[];
  readonly onToggle: (id: number) => void;
  readonly onEdit: (id: number) => void;
  readonly onDelete: (id: number) => void;
}

export interface TodoItemProps {
  readonly todo: Todo;
  readonly onToggle: (id: number) => void;
  readonly onEdit: (id: number) => void;
  readonly onDelete: (id: number) => void;
}
'''
replace_with_code(paras[22], PROPS_CODE)

cap = replace_with_image(
    paras[25], ROOT / "docs" / "ui-todo.png",
    "图 1　React 版待办清单运行截图（Edge / Vite preview）", width=5.5,
)
build_image = insert_after(cap, "")
replace_with_image(
    build_image, ROOT / "docs" / "build-success.png",
    "图 2　npm run build 成功（tsc --noEmit + vite build）", width=5.5,
)

set_text(paras[28], "挂载点破坏 Grid 布局：", bold=True)
paras[28].style = doc.styles["List Bullet"]
run = paras[28].add_run(
    "#todo-root 若生成普通盒子，会成为 .section.todo 的唯一子项，原有 row-gap "
    "失效；用 display: contents 解决。"
)
style_run(run)
add_bullets_after(paras[28], [
    [("持久化 effect 首次执行会覆盖恢复数据：", True),
     ("加载后立刻保存会把“恢复 → 保存”变成无意义写入；用 ref 跳过首次渲染。", False)],
    [("StrictMode 下 effect 双执行：", True),
     ("开发态日志重复，最终以 vite preview 的生产构建做 UI 验证，避免误判。", False)],
])

# ---------------------------------------------------------------- 任务 2

set_text(
    paras[32],
    "在 src/components/ 搜索 document.querySelector、document.getElementById、"
    "innerHTML：0 处；全项目 src/ 仅 1 处 document.getElementById('todo-root')，"
    "位于 main.tsx 的挂载入口。",
)
cap = replace_with_image(
    paras[33], ROOT / "docs" / "source-search.png",
    "图 3　业务组件目录 DOM 操作搜索：0 处", width=5.5,
)
replace_with_image(
    paras[34], ROOT / "docs" / "components-tree.png",
    "图 4　src/components/ 目录结构与 Props 接口", width=5.5,
)

set_text(paras[39], "npm test：41/41 全部通过（手写 19 条 + 审查后补齐 22 条）。")
test_image = insert_after(paras[39], "")
replace_with_image(
    test_image, ROOT / "docs" / "test-success.png",
    "图 5　npm test 全部通过（2 个测试文件，41 条用例）", width=5.2,
)

set_text(
    paras[41],
    "答：本轮没有失败。关键是业务逻辑仍留在 todo-core.ts，组件只组合调用纯函数："
    "setTodos(addTodo(todos, text, id).todos)、"
    "setTodos(toggleTodo(todos, id).todos)、"
    "setTodos(removeTodo(todos, id).todos)。如果测试失败，正确修法是把组件里"
    "内联的逻辑抽回纯函数，而不是修改测试断言。",
)

# 轨道 B 表格
track_b = doc.tables[0]
track_b_rows = [
    ("输入“任务A”，点击添加", "输入框清空，列表多一项",
     "通过：输入框为空；列表 1 项；state 同步 1 项"),
    ("在控制台打印 todos", "数组内容与页面列表一致",
     "通过：window.__todoState 与 DOM 文本逐项一致"),
    ("点击任务A的“完成”按钮", "文字出现删除线 / 样式变化",
     "通过：text-decoration: line-through；is-completed 生效"),
    ("点击任务A的“删除”按钮", "列表少一项，控制台数组同步少一项",
     "通过：列表剩 1 项；state 同步剩 1 项"),
]
for row_index, values in enumerate(track_b_rows, start=1):
    for col_index, value in enumerate(values):
        fill_cell(track_b.rows[row_index].cells[col_index], value,
                  size=TABLE_SIZE)
for col_index, value in enumerate(
        ("验证操作", "预期现象", "实际现象")):
    fill_cell(track_b.rows[0].cells[col_index], value, bold=True,
              size=TABLE_SIZE)
track_b.autofit = False
for col_index, width in enumerate((1.55, 1.55, 2.4)):
    track_b.columns[col_index].width = Inches(width)
    for cell in track_b.columns[col_index].cells:
        cell.width = Inches(width)

set_text(
    paras[47],
    "状态一致性说明：页面列表与 window.__todoState 来自同一个 todos state，"
    "不存在第二份视图数据。每次 state 更新后，组件输出 "
    "console.info('[TodoApp] todos =', todos) 并同步 window.__todoState；"
    "自动化脚本逐步比较 DOM 文本与 state JSON，确认页面呈现与数据始终一致"
    "（24/24 通过）。",
)
state_image = insert_after(paras[47], "")
replace_with_image(
    state_image, ROOT / "docs" / "ui-state.png",
    "图 6　页面列表与控制台 state 对照", width=5.6,
)

set_text(
    paras[50],
    "真浏览器验证刷新持久化时，addInitScript 会在每次导航时清空 localStorage，"
    "导致恢复测试误判；改为用 sessionStorage 标记，只在本会话首次加载时清空。",
)

# ---------------------------------------------------------------- 任务 3

def read_fence(path: Path, lang: str) -> str:
    text = path.read_text(encoding="utf-8")
    match = re.search(rf"```{lang}\n(.*?)```", text, re.S)
    if match is None:
        raise ValueError(f"{path} 中没有 ```{lang} 代码块")
    return match.group(1)

PROMPT = read_fence(ROOT / "docs" / "task3-prompt.md", "text")
FIXED = read_fence(ROOT / "docs" / "task3-ai-fixed-snippet.md", "tsx")
TARGET = read_fence(ROOT / "docs" / "task3-target.md", "tsx")

replace_with_code(paras[96], PROMPT)
replace_with_code(paras[98], FIXED)

# 靶子代码：把原来的 40 个单行段落合并成一个代码块
for paragraph in paras[56:95]:
    delete_paragraph(paragraph)
replace_with_code(paras[55], TARGET)

# 范式残留审查表
audit = doc.tables[1]
audit_rows = [
    ("直接改 state 数组", "listRef = todos; listRef.push(...)",
     "已修",
     "setTodos((prev) => [{ ...newTodo }, ...prev])；没有 push"),
    ("同一引用传给 setState", "setTodos(listRef) / setTodos(todos)",
     "已修", "改为函数式 setTodos(prev => ...)，每次返回新数组"),
    ("手动 DOM 操作", "listEl.innerHTML += '<li>...</li>'",
     "已修", "整段删除；列表只由 JSX 的 todos.map 渲染"),
    ("map 中原地改对象", "t.completed = !t.completed，且没有 return",
     "已修", "prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)"),
    ("id 可能重复", "id: Date.now() 同一毫秒内会重复",
     "未修", "修复版仍为 id: Date.now()"),
    ("文本未规范化", "用 text.trim() 判空，却把原始 text 存入 state",
     "未修", "仍为 { text, completed: false }"),
]
# 模板已有表头 + 3 行空行，补足到 6 行
while len(audit.rows) < len(audit_rows) + 1:
    audit.add_row()
for row_index, values in enumerate(audit_rows, start=1):
    for col_index, value in enumerate(values):
        if col_index == 2:
            fill_cell(audit.rows[row_index].cells[col_index], value,
                      bold=True, size=TABLE_SIZE,
                      color=GREEN if value == "已修" else RED)
        else:
            fill_cell(audit.rows[row_index].cells[col_index], value,
                      size=TABLE_SIZE if col_index != 3 else 8.2,
                      code=(col_index == 3))
for col_index, value in enumerate(
        ("坑", "原始问题", "AI 修了吗？", "证据（AI 修复后的对应代码）")):
    fill_cell(audit.rows[0].cells[col_index], value, bold=True,
              size=TABLE_SIZE)
audit.autofit = False
for col_index, width in enumerate((1.0, 1.45, 0.65, 2.4)):
    audit.columns[col_index].width = Inches(width)
    for cell in audit.columns[col_index].cells:
        cell.width = Inches(width)

set_text(
    paras[105],
    "规则：空文本 / 纯空白不能新增。AI 修复版保留了 "
    "const value = text.trim(); if (value === '') return;，并返回原数组，"
    "规则仍成立。",
)
set_text(
    paras[106],
    "验证：用 docs/task3-audit.mjs 对修复版纯函数跑了 12 组断言：空串、纯空白"
    "被拦截；正常新增置顶；原数组不被修改；切换返回新数组、原对象不变、"
    "未命中项保持原引用。12/12 通过；最终项目的 41 条单测与 24 项 UI 验证也"
    "覆盖同类规则。",
)

set_text(paras[109], "部分修改。", bold=True)
last = insert_after(
    paras[109],
    "接受 AI 对 4 个“假 React”范式的修复：不可变更新、函数式 setState、"
    "删除 DOM 操作、列表由 JSX 渲染，这部分修得彻底。",
)
last.paragraph_format.space_after = Pt(2)
last = insert_after(
    last,
    "但不接受两处残留：① Date.now() 在同一毫秒内连续新增会产生重复 key；"
    "② 判空用 trim，入库却是原始文本，首尾空白会进入数据层，与项目 "
    "todo-core 的 normalizeText 规则不一致。",
)
intro = insert_after(last, "最终改为复用数据层已验证的函数：")
code_paragraph = insert_after(intro, "")
last = replace_with_code(code_paragraph, r'''
const id = nextTodoId(todos);
const result = addTodo(todos, text, id);
if (!result.ok) return;
setTodos(result.todos);
''')
last = insert_after(
    last,
    "即：范式修复接受，id 生成与文本规范化由项目纯函数接管。修改后 41 条单测、"
    "24 项 UI 验证全部通过。",
)

# ---------------------------------------------------------------- 总结

answer = insert_after(
    paras[112],
    "答：React 不是把 DOM 操作换个地方写，而是让 state 成为唯一数据源；"
    "审查 AI 修复时，范式问题靠源码搜索确认，业务是否被改坏靠测试基线说话。",
)
answer.paragraph_format.space_before = Pt(4)

note = insert_after(
    answer,
    "完整证据：docs/ui-verify.txt（24 项 UI 验证）、docs/source-search.txt"
    "（源码扫描）、docs/task3-audit.txt（12 组修复版断言）；源码：src/components/。",
    size=8.5,
)
for run in note.runs:
    run.font.color.rgb = GRAY
    run.italic = True

# ---------------------------------------------------------------- 分页优化
# 根据最终排版结果，把「标题 / 引导语 / 图片」与紧随其后的代码块、表格、
# 图片或图注绑定，避免标题孤悬页底、代码块与说明分家。

def _has_drawing(paragraph: Paragraph) -> bool:
    return paragraph._p.find(".//" + qn("w:drawing")) is not None


def _is_code(paragraph: Paragraph) -> bool:
    return bool(paragraph.paragraph_format.keep_together)


body_children = []
for child in doc.element.body.iterchildren():
    if child.tag == qn("w:p"):
        body_children.append(Paragraph(child, doc))
    elif child.tag == qn("w:tbl"):
        body_children.append(Table(child, doc))

heading_prefixes = ("一、", "二、", "三、", "四、", "五、", "【", "①", "②", "③")
for i, block in enumerate(body_children):
    if not isinstance(block, Paragraph):
        continue
    text = block.text.strip()
    nxt = body_children[i + 1] if i + 1 < len(body_children) else None

    bold_all = bool(block.runs) and all(bool(run.bold) for run in block.runs)
    is_heading = bold_all and (
        text.startswith(heading_prefixes) or re.match(r"^\d+\.\s", text) is not None
    )

    keep = is_heading
    if isinstance(nxt, Table):
        keep = True
    if isinstance(nxt, Paragraph):
        if _is_code(nxt):
            keep = True
        elif _has_drawing(nxt) and not text.startswith("图 "):
            keep = True
    if (_has_drawing(block) and isinstance(nxt, Paragraph)
            and nxt.text.strip().startswith("图 ")):
        keep = True
    if keep:
        block.paragraph_format.keep_with_next = True

# 文档属性
doc.core_properties.author = "张衡"
doc.core_properties.title = "AI 协作日志 W11"
doc.core_properties.subject = "V4.0 React 组件化重构与验证"

doc.save(str(OUTPUT))
print(f"saved: {OUTPUT}")
