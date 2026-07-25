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
  icon: string          // icon key, e.g. "github", "envelope"
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
  photo?: string         // 相对模板根的路径
  contacts: Contact[]
}

type ResumeData = {
  basics: Basics
  skills: SkillSection[]
  education: ItemBlock[]
  experience: ItemBlock[]
  projects: ItemBlock[]
  awards: Award[]
  meta?: {                              // 文档级控制，不参与渲染样式
    template?: string
    locale?: string                     // 影响排版与字符处理
    fontSize?: number                   // 字号微调
  }
}
```

JSON Schema / Zod schema 的实现属于 `packages/core`，本文件不下放。

## 4. 模板目录结构

```
templates/
├── default/                # v1 必备模板
│   ├── template.typ        # 入口，声明如何读取 resume.json
│   ├── meta.toml           # 模板元信息（被 CLI / Web 读取）
│   ├── fonts/              # 自带字体（可选）
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
font        = "Microsoft Yahei"
mono-font   = "Cascadia Mono"
```

字段命名约定：Kebab-case（与 Cargo / Biome / GitHub config 一致），Zod schema 用 camelCase 类型推导，但 TOML 文件落盘用 kebab-case（人类书写友好）。

`config` 是模板特定的样式覆盖，由 `compiler` 注入到 JSON 中作为 `meta.config`。

## 5. template.typ 的新形态

入口约定：

```typst
// templates/default/template.typ
#let data = json("resume.json")     // compiler 注入此文件路径
#let config = data.meta.config

// --- 颜色/字体来自 config，不再 hardcode ---
#let colors = (
  main: rgb("#343434"),
  theme: rgb(config.themeColor),
  link: rgb("#1e6485"),
  secondary: rgb("#808080"),
)

// --- 复用现有原语，但读 from `data` ---
#show: resume-page.with(
  font-size: data.meta.fontSize,
  photo: data.basics.photo,
  colors: colors,
  fonts: (main: config.font, mono: config.monoFont),
)

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
                                │    (内置 icon + 字体)  │
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
| 1 | 把 `template.typ` 中的常量（colors / fonts）抽到 `meta.toml.config` | TBD |
| 2 | 把 `#resume.with(...)` 改造成接受 `data + colors + fonts` 的纯渲染函数 | TBD |
| 3 | 把 `resume.typ` 中的内容改写成一份对应 `ResumeData` 的 JSON | TBD |
| 4 | 新增 `templates/default/template.typ`，引用改造后的函数 | TBD |
| 5 | 原 `resume.typ` / `template.typ` 保留为 `examples/sample.typ` 作为回归基准 | TBD |

W2 退出条件：`default` 模板对占位 fixture 的输出 PDF 与参考样式视觉一致（≥ 95%），否则视为不达标。

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
