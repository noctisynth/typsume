# Data-Driven Template Design (W2)

> 此文档定义 `templates/` 的契约：模板如何声明自己、如何消费 JSON、如何与 schema 对齐。
> 属于 W2 里程碑：把现有 `template.typ` 从"函数式声明"重构为"JSON 驱动渲染"。

---

## 1. 设计目标

将当前 `resume.typ` 的 `template.typ` 改造成 **数据驱动的渲染层**：

- 模板只关心**怎么排版**，不关心**数据从哪来**
- 同一份 JSON 数据，可以套不同模板生成不同样式的 PDF
- 模板的字段需求必须**显式声明**，便于 schema 校验和表单生成

## 2. 当前形态的问题

现状：`template.typ` 暴露一组 Typst 函数（`#resume`, `#item`, `#info`, ...），用户在 `resume.typ` 里手写调用。这有两个问题：

1. **门槛 = Typst 语法**，非用户写不了
2. **样式与字段耦合**，换模板必须重写全部调用代码

新形态：模板读取一份 JSON 对象，所有"调用"由 compiler 自动拼接。

## 3. 数据契约（ResumeData）

权威定义在 [`packages/core/src/schema.ts`](../packages/core/src/schema.ts)（W1 已落地）。文档先固定形状，schema 文件给出精确类型 + 默认值：

```ts
type Contact = {
icon: string          // 内置 key（email/phone/github）或项目相对 SVG/PNG 路径
  text: string          // 显示文本
  link?: string         // URL，缺省则不渲染为链接
}

type SkillItem = {
  name: string
  level?: "精通" | "熟悉" | "了解"
}

type SkillSection = {
  name: string          // 分类名，如 "语言"、"前端"
  items: SkillItem[]
}

type ItemBlock = {
  title: string                          // 主标题（项目名 / 公司名）
  subtitle?: string                      // 副标题（角色 / 来源）
  period?: string                        // 时间段，原样排版
  department?: string                    // 工作经历的部门 / 业务线
  stack?: string[]                       // 技术栈标签
  links?: { label: string, href: string }[]
  body?: string                          // 正文（Markdown 子集）
  highlights?: string[]                  // bullet list
  extra?: Record<string, unknown>        // 模板自定义字段
}

type Award = {
  title: string
  date: string
  level?: string
}

type Basics = {
  name: string
  title?: string         // 头衔 / 一句话定位，例如 "Software Engineer"
  photo?: string         // 相对简历项目根的路径，例如 assets/profile.png
  contacts: Contact[]
}

type ResumeData = {
  schema: 'typst-resume/1.0'            // schema 版本字面量，便于将来 bump 时直接拒绝老数据
  basics: Basics
  skills: SkillSection[]
  education: ItemBlock[]
  experience: ItemBlock[]
  projects: ItemBlock[]
  awards: Award[]
  meta?: {                              // 文档级控制，不参与渲染样式
    template?: string
    locale?: string                     // 影响排版与字符处理
  }
}
```

样式不进入 ResumeData。模板默认值来自 `meta.toml[config]`；CLI 从项目
`typsume.config.toml[config]` 读取同名覆盖，Web 保存在独立样式模型中。core 负责校验与合并，
确保两端向 Typst 注入相同的 `cfg_*.json`。

字段在不同 section 中的语义：

- `experience`：`title` 是公司/组织，`subtitle` 是职位，`department` 是部门或业务线。
- `projects`：`title` 是项目名，`subtitle` 是项目来源，`stack` 是技术栈或项目标签。
- `education`：`title` 是学校，`subtitle` 是专业、院系或学位。

default 模板在工作经历中把 `department` 渲染到原模板 `#tech[...]` 的位置，在项目经历中
则在同一位置渲染 `stack`。`stack` 不用于承载部门名称。

`basics.photo` 必须是简历项目根内的相对路径。compiler 只挂载该字段直接引用的文件，不递归暴露
整个项目目录；绝对路径、`..` 越界、目录或不存在文件都必须显式报错。Web 上传图片时生成
`assets/<安全文件名>` 并保留原始 PNG/JPEG 字节，CLI 在解压项目 ZIP 后读取同一路径。

`basics.contacts[].icon` 优先按模板内置 key 解析；default 模板至少支持 `email` / `envelope`、
`phone` 与 `github`。包含 `/` 或以 `.svg` / `.png` 结尾的值视为项目相对自定义图标路径，沿用
照片相同的越界防护但只挂载被引用的具体文件。Web 上传自定义图标到 `assets/` 并随项目 ZIP 导出。

default 模板的 awards 按 `date` 首次出现顺序分组；同一日期只显示一次，右侧可排列多个奖项，
`level` 作为次要文本；日期、短标记与奖项标题按同一水平基线对齐。荣誉布局不得通过整组测量
高度绘制贯穿空白区的时间轴；多行标题使用自然行高并撑开后续条目，日期列只保留显示年份所需宽度。
每个奖项使用同一份年份/圆点/文本三列网格；同年份只有第一条显示左对齐年份，圆点在固定首行高度
中居中，以对齐右侧标题第一行而不是整个多行文本块。
default 模板正文顺序固定为教育背景、实习经历、项目经历，姓名不添加方括号等装饰字符。
`skills`、`awards`、`projects`、`experience` 或 `education`
数组为空时，default 模板不得渲染对应的 section 标题或占位空白。

JSON Schema / Zod schema 的实现属于 `packages/core`，本文件不下放。

## 4. 模板目录结构

```
templates/
├── default/                # v1 必备模板
│   ├── template.typ        # 入口，声明如何读取 resume.json
│   ├── meta.toml           # 模板元信息（被 CLI / Web 读取）
│   ├── fonts/              # 小型、本地字体（可选；大型字体应声明为远程资源）
│   ├── icons/              # 自带 icon（可选）
│   └── preview.png         # 缩略图
├── modern/                 # v1.1 第二套样式
└── MINIMAL-LICENSE         # 模板分发许可
```

### `meta.toml` Schema

```toml
name         = "default"
display-name = "默认简历"
description  = "经典双栏布局，左侧内容右侧照片"
version      = "1.0.0"
author       = "<author>"
license      = "MIT"
page         = "a4"

required-fields = ["basics.name"]
optional-fields = ["basics.photo", "awards"]

[config]
theme-color = "#0b628b"
font        = "Noto Sans CJK SC"
mono-font   = "JetBrains Mono"
font-size   = 10
contact-size = 8.5

[[resources.fonts]]
urls = [
  "https://example.com/font-primary.zip",
  "https://example.com/font-mirror.zip",
]
integrity = "sha256-<base64>" # 可选
```

字段命名约定：Kebab-case（与 Cargo / Biome / GitHub config 一致），Zod schema 用 camelCase 类型推导，但 TOML 文件落盘用 kebab-case（人类书写友好）。

`config` 是模板特定的 Typst 渲染参数；其中 `font` / `mono-font` 是字体 family name，
不是文件路径或下载地址。`resources.fonts` 是编译器资源清单，不会注入 Typst 数据。

### 字体资源契约

- 一个模板可以声明多组 `[[resources.fonts]]`；每组资源的 `urls` 至少包含一个 URL。
- 同一组资源的 URL 是镜像关系。compiler 按声明顺序尝试，成功取得有效字体后停止尝试该组的后续 URL。
- CLI 在缓存未命中且即将联网前请求确认；`--allow-downloads` 或 `GITHUB_ACTIONS=true` 跳过交互并授权下载。
- `integrity` 可选，格式固定为 `sha256-<base64>`，校验对象是下载响应的原始字节。校验失败等同该 URL 失败。
- 响应类型按内容识别，不依赖 URL 后缀或 `Content-Type`。v1 支持直接 `.ttf` / `.otf` 字体和 ZIP 压缩包。
- ZIP 使用 `fflate` 在内存中解压，只加载其中的 `.ttf` / `.otf` 文件；目录和其他文件不传给 typst.ts。
- 模板本地 `fonts/`、项目 `[build].font-paths` 指向的字体与远程字体字节最终一起传给 typst.ts `loadFonts`。项目字体路径必须相对项目根目录，且不能越界。
- CLI 把下载响应的原始字节缓存到简历项目的 `.typsume/fonts/`；Web 不做持久缓存，只在页面生命周期内复用字节。
- `template.typ` 不负责联网、解压或校验，也不得直接引用远程 URL。

CLI 缓存约定：

- project root 从 source 文件所在目录向上查找最近的 `typsume.config.toml`；找不到时使用 source 所在目录。
- 缓存键是该资源完整声明（有序 `urls` + 可选 `integrity`）的 SHA-256 十六进制摘要，不在文件名中暴露 URL。
- 下载先写入 `.typsume/fonts/` 内的临时文件；读取完整响应并通过可选 integrity 后，原子重命名为最终缓存文件。只有最终文件存在才算命中。
- 缓存保留原始 TTF / OTF 或 ZIP，不保存解压结果。命中后仍在内存中识别、校验和解压。
- 缓存损坏或与 integrity 不符时，明确告知将重新下载；重新取得有效资源后替换损坏缓存。
- `.typsume/.gitignore` 内容为 `*`，使整个运行时目录不进入 Git。`typsume init` 负责创建它，`build` 在旧项目中缺失时也会补建。
- 没有 integrity 时，同一 URL 上游内容更新不会自动失效；用户通过删除 `.typsume/fonts/` 显式刷新。

资源加载的非预期行为必须可观察：

- 单个 URL 失败时，说明失败原因以及是否即将尝试下一个镜像。
- 校验失败、ZIP 解压失败、ZIP 中没有字体或部分字体被跳过时，说明当前结果和下一步。
- 所有镜像失败时，明确说明将不加载该组远程字体、继续尝试编译，并提示排版可能变化或编译可能失败。
- URL 日志不得输出查询参数或凭证。
- 当前阶段不承诺 typst.ts 自动加载系统字体；跨平台系统字体发现属于后续任务。

## 5. template.typ 的新形态

入口约定：

```typst
// templates/default/template.typ
#let data       = json("resume.json")
#let colors     = json("cfg_colors.json")
#let fonts      = json("cfg_fonts.json")
#let sizes      = json("cfg_sizes.json")
#let layout_cfg = json("cfg_layout.json")

// compiler 解析 meta.toml 后注入 cfg_*.json；Typst length 需要恢复为原生值。
#let length_of(value) = eval(value, mode: "code")

// --- 复用现有原语；sections 在 markup content block 中读取 `data` ---
#let header = [
  = #data.basics.name

// ----- 联系方式 -----
#info(
  color: colors.theme,
  ..data.basics.contacts.map(c => (
    icon: icons.at(c.icon),
    content: c.text,
    link: c.at("link", default: none),
  ))
)

// ----- 技术栈 -----
#for section in data.skills [
  == #icons.fa-wrench #section.name
  #for item in section.items [
    - #tech-stack(level: item.at("level", default: "熟悉"), item.name)
  ]
]

// ----- 项目 / 经历 -----
#]

#let body = [
#for p in data.projects [
  #v(0.7em)
  #item(
    link(p.links.at(0).href, [* #p.title *]) if p.links.len() > 0 else [* #p.title *],
    [#p.subtitle],
    date[#p.period],
  )
  #if p.stack.len() > 0 [
    #tech[ #p.stack.join(" / ") ]
  ]
  #if p.body != none [ #p.body ]
  #if p.highlights.len() > 0 [
    - #p.highlights.join("\n- ")
  ]
]
#]

#resume(
  font-size: sizes.font * 1pt,
  margin: (
    top: length_of(layout_cfg.margin_top),
    bottom: length_of(layout_cfg.margin_bottom),
    left: length_of(layout_cfg.margin_left),
    right: length_of(layout_cfg.margin_right),
  ),
  gutter-width: length_of(layout_cfg.gutter_width),
  side-width: length_of(layout_cfg.side_width),
  photo: data.basics.at("photo", default: none),
  header,
  body,
)
```

模板的 `template.typ` **禁止**引用 `../`、`/abs/path` 之类的相对外部路径。一切所需资源都从模板根目录出发。

## 6. 数据流（详细）

```
┌──────────┐    JSON.stringify     ┌────────────────┐
│  任意源   │ ──────────────────► │   resume.json  │
└──────────┘                      └────────┬───────┘
                                            │
                  template + compiler (typst.ts WASM)  │
                                            ▼
                                ┌───────────────────────┐
                                │  typst.ts compile     │
                                │    template.typ       │
                                │    resume.json        │
                                │ (内置 icon + 本地/远程字体) │
                                └──────────┬────────────┘
                                           ▼
                                        *.pdf
```

**关键点**：`compiler` 把 JSON 数据写到临时目录 `resume.json`，然后**同进程**调用 typst.ts WASM 的 `compile()`，传入模板根路径 + 数据文件路径。`compiler` 不需要生产中间 `.typ` 字符串拼接（避免双重维护），也不需要外部 typst 二进制——CLI 和 Web 共用同一份 WASM artifact。

> 例外：模板可以自带"胶水 .typ"——只是 typst 的一个 wrapper 文件，负责 `read` JSON。`compiler` 不需要理解模板对 JSON 的字段访问方式。

## 7. 与现有 template.typ 的迁移路径

下面是从仓库当前结构改造的步骤：

| 步骤 | 内容 | 状态 |
|------|------|------|
| 1 | 把 `template.typ` 中的 colors / fonts / sizes / layout 常量抽到 `meta.toml.config` | 完成 |
| 2 | 保留原有排版 helpers；数据 sections 在 `header` / `body` markup content block 中 inline 渲染 | 完成 |
| 3 | 把原硬编码内容改写为符合 `ResumeData` 的 `examples/sample/resume.json` | 完成 |
| 4 | 新增自包含的 `templates/default/template.typ`，只读取 compiler 注入的数据和模板根资源 | 完成 |
| 5 | 原视觉参考样式回归基准 | 已取消；W2 不做主观视觉或像素级验收 |

W2 退出条件：`default` 模板对占位 fixture 成功输出 PDF。W2 不设置主观视觉或像素级验收。

## 8. 多模板隔离约定

- 模板之间**不允许**互相 include，所有资源自包含
- 模板对 `data.*` 字段访问应**做空值保护**（`at` + `default`），以保证缺失字段不会编译失败
- `compiler` 在生成 JSON 时已经经过 schema 校验，所以"必填缺失"理论上不会发生；保护层是兜底
- `meta.toml.requiredFields` 列出模板**额外需要**的字段，由 `compiler` 校验时二次检查

## 9. 自定义模板入口（CLI / Web 共享）

CLI：
```bash
typsume build resume.json --template ./my-custom-template -o out.pdf
```

Web（v1.1+）：
- 模板市集页：列出 `templates/<name>/meta.toml` + `preview.png`
- 用户上传：拖拽文件夹 zip，存到 IndexedDB

## 10. 验证清单（DoD）

- [ ] `examples/sample/resume.json` 通过 `default` 模板输出 PDF（占位数据，仅用于 smoke test）
- [ ] 第二个模板 `modern` 跑同一份 JSON，输出另一套样式
- [ ] `meta.toml.requiredFields` 与实际模板访问的字段一致
- [ ] 缺字段时（schema 通过、模板字段缺失）输出明确错误而非泛编译错误
- [ ] 远程直接字体与 ZIP 字体均可注入编译器；镜像回退和异常后续行为均有明确输出
