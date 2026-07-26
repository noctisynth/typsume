# TODO.md

> 活任务清单。状态：`[ ]` 待办 / `[~]` 进行中 / `[x]` 完成 / `[!]` 阻塞
> 任务粒度 ≤ 半天工作量；超出即拆。
> 任一项的状态变化**只能由代码 / PRD 更新触发**，不可凭口述修改。

> **首要规则**：任何任务开始前，确认 [`docs/PRD.md`](./docs/PRD.md)（及该任务涉及的子文档）反映了目标行为。若 doc 与用户意图不符，先改 doc。

---

## 当前阶段：W1 — `packages/core` 起架

**退出条件**：`bun run -F core test` 全绿；`examples/sample/resume.json` 与若干边界用例通过 schema 校验。

### 1.1 Monorepo 骨架（待 user 授权后开始）

- [x] 在仓库根创建 `package.json`（`{ "workspaces": ["packages/*", "templates/*"] }`，name：`typst-resume`）
- [x] 创建 `tsconfig.base.json`（strict / bundler resolution / ESNext）
- [x] 创建 `biome.json`（lint + format；indentWidth=2，space，单引号）
- [x] 创建 `.gitignore`（node_modules / dist / .DS_Store / *.log / .turbo）
- [x] 创建 `packages/core/package.json`（name `@typst-resume/core`，type module，deps: `zod` + dev: `vitest` + `ajv` + `typescript`）
- [x] 创建 `packages/core/tsconfig.json`（extends base）
- [x] 跑通 `bun install`（需 user 授权）

### 1.2 ResumeData Schema

> 严格遵循 [`docs/data-driven-template.md`](./docs/data-driven-template.md) §3 的形状；不要凭空加字段。

- [x] `packages/core/src/schema.ts`
  - `ContactSchema`（`icon: string, text: string, link?: url`）
  - `BasicsSchema`（`name: min(1), title?, photo?: string, contacts: Contact[]` 默认 `[]`）
  - `SkillItemSchema`（`name, level?` 枚举 `精通|熟悉|了解`）
  - `SkillSectionSchema`（`name, items: SkillItem[]` min 1）
  - `ItemBlockSchema`（`title, subtitle?, period?, stack?: string[], links?: {label, href} [], body?, highlights: string[]` 默认 `[]`, `extra?`）
  - `AwardSchema`（`title, date, level?`）
  - `ResumeMetaSchema`（`template?, locale?, fontSize?`）
  - `ResumeSchema`（包含 `schema: literal "typst-resume/1.0"`、`basics`、`skills`、`education`、`experience`、`projects`、`awards`、`meta?`）
- [x] 默认值策略：数组字段默认 `[]`，可选字段默认 `undefined`，跟 doc 描述一致
- [x] 错误信息本地化：Zod 默认英文即可；中文友好错误是 v1.1

> **偏离记录**：JSON Schema 不再由 `zod-to-json-schema` 生成——该库最新版本（3.25.2）对 zod 4 输出空 schema；改用 zod 4 自带的 `z.toJSONSchema({ target: 'draft-7' })`。`ajv` + `ajv-formats` 校验 `format: 'uri'` 等关键字。

### 1.3 类型派生

- [x] `packages/core/src/types.ts`：`type ResumeData = z.infer<typeof ResumeSchema>`
- [x] `export type ResumeData`
- [x] 把所有类型 re-export 到 `packages/core/src/index.ts`

### 1.4 JSON Schema 派生（CLI/Web 共享）

- [x] `packages/core/src/json-schema.ts`：用 `z.toJSONSchema(schema, { target: 'draft-7' })` 生成 JSON Schema 7
- [x] 导出 `resumeJsonSchema` 与 `RESUME_JSON_SCHEMA_STRING`
- [x] 测试（见 1.5）保证 Zod schema 与生成的 JSON Schema 在同一组 fixture 上行为一致（happy + 负例）

### 1.5 测试

- [x] `packages/core/test/schema.test.ts`
  - happy：完整 resume 通过
  - 缺必填：`basics.name` 缺失报错
  - enum 越界：`level: "略懂"` 报错
  - URL 非法：`links[0].href: "abc"` 报错
  - 数组默认：缺 `awards` 时默认为 `[]`
- [x] `packages/core/test/schema.test.ts`：JSON Schema 与 Zod schema 在同一组 fixture 上等价（Ajv + ajv-formats）
- [x] fixture（占位数据，参考 [`AGENTS.md`](./AGENTS.md) §1.5 隐私约定）：
  - `packages/core/test/fixtures/sample.json`（占位姓名+典型完整结构）
  - `packages/core/test/fixtures/minimal.json`（最小必填）
  - `packages/core/test/fixtures/invalid.json`（故意打破，校验用例）

### 1.6 文档同步

- [x] 在 [`docs/PRD.md`](./docs/PRD.md) §6 仓库结构图给 `packages/core/` 加 "(✅ 起架)" 标记
- [x] 在 [`docs/data-driven-template.md`](./docs/data-driven-template.md) §3 把 "权威定义" 链接指向 `packages/core/src/schema.ts`

> **W1 退出条件已达成**。下一里程碑：W2 — `templates/default` + CLI smoke。

---

## W2 — `templates/default` 改造 + CLI smoke（依赖 W1）

> 不要在 W1 完成前开始。

- [x] 把 `templates/default/template.typ` 写成 data-driven 版本（参考 [`docs/data-driven-template.md`](./docs/data-driven-template.md) §5 / §7）
- [x] 写 `templates/default/meta.toml`（主题色、字体、必需字段；遵守 kebab-case 落盘）
- [x] 导出 `examples/sample/resume.json`（基于占位数据，覆盖典型结构；通过 schema 校验）
- [x] 写最小的 typst.ts WASM smoke：通过 core schema → 写 JSON → typst.ts compile → 输出 PDF
- [ ] DoD：default 模板对占位 fixture 输出 PDF（视觉与参考样式像素级一致，允许抗锯齿差异）

> **W2 偏离记录**：
> 1. **schema version 字面量**：`cv/1.0` → `typst-resume/1.0`（与项目名一致；旧 `cv` 已废弃，ADR 同步）。
> 2. **typst.ts API 选型**：cookery 文档里的 `NodeCompiler.create()` 在 0.7.0 已下线；改用底层 `createTypstCompiler() + init({ workspace, beforeBuild: [withAccessModel(...)] }) + compile({ format: pdf })`。
> 3. **AccessModel**：typst.ts 自带 `FetchAccessModel` 内部用 `XMLHttpRequest`（浏览器 API），Node 端无法使用；改用 `MemoryAccessModel`（注意其路径必须以 `/@memory/` 开头）。
> 4. **cfg 注入**：meta.toml 由 CLI/smoke 解析后切成 `cfg_colors.json / cfg_fonts.json / cfg_sizes.json / cfg_layout.json` 注入到虚拟 workspace；模板用 `json("cfg_*.json")` 读取。`length` 类型用 `eval(..., mode: "code")` 还原（typst 不接受 raw string 当 length）。
> 5. **可选字段访问**：schema optional 字段在 typst 里 `data.foo` 会"dictionary does not contain key"——必须用 `data.at("foo", default: none)`。
> 6. **字体**：用 Maple Mono NF CN（OFL 1.1 开源，跨平台，覆盖中英文），从 `~/Library/Fonts` 复制 Regular + Bold 到 `templates/default/fonts/`，附 `OFL-NOTICE.txt`。
> 7. **Icons**：从 `../resume/icons/*.svg`（FontAwesome 4/5 风格）复制到 `templates/default/icons/`，完全沿用，不重新设计。
> 8. **layout 重写**：layout 与 helpers（resume, info, sidebar, item, space-between, tech, tech-stack, proficiency, date, icon, icons）逐字照抄 `../resume/template.typ`；data-driven 部分直接 inline 进 `#show: resume.with(...)[ ... ]` 的 content block，沿用 `for ... in data.X [...]` + `it.at("key", default: ...)` 模式。**未抽 render-xxx 函数**——typst 0.13 的 `for` 在 `let f = {}` 块内返回 array（不是 content），会破坏 `stack({...})` 类函数调用，所以 sections 必须 inline 在 markup context。
> 9. **awards sidebar**：原 `../resume/resume.typ` 用 `stack({ linebreak(); linebreak(); v(0.8em); text(...) })` 是 `{}` code block + 简单函数调用。data-driven 时改成 `stack(for a in data.awards [content])`——`for` 表达式在 markup 上下文返回 content，`stack()` 接受 single content 作为 child。
> 10. **loadFonts 选项**：`loadFonts([], { assets: false })` 显式禁用 typst.ts 默认从 jsdelivr CDN 拉 NewCMMath-Bold.otf（沙盒环境无外网）。
> 11. **biome lints**：`biome.json` 在 `files.includes` 中排除 `templates/default/icons/*.svg`（a11y noSvgWithoutTitle）和 `templates/default/fonts/*.ttf`（格式）。

> **W2 中间态**：smoke 跑通 `examples/sample/resume.json → templates/default/template.typ → 58373 字节 / 2 页 PDF`。所有 sections（技术栈/荣誉/项目/实习/教育）+ 完整 helpers（item 三列 grid / space-between 时间对齐 / tech-stack + proficiency / sidebar 横向双列 / info monospace 多行）均渲染成功。

## W3 — `packages/cli`

- [ ] citty 命令脚手架
- [ ] `typsume build / validate / dump / templates / dev / init / help`
- [ ] TOML 配置加载（项目 + `~/.config/typsume/config.toml`）
- [ ] WASM 编译通道同进程
- [ ] DoD：CI 在 ubuntu-latest 全新镜像除 bun 外不装任何东西，build 通过

## W4 — `packages/web`

- [ ] Vite + React 19 + shadcn/ui 骨架
- [ ] 三栏布局（左表单 / 中预览 / 右大纲）
- [ ] Zustand + persist (IndexedDB)
- [ ] react-hook-form + zodResolver
- [ ] `typst.ts` 浏览器端集成 + `<TypstDocument />`
- [ ] DoD：浏览器填表出 PDF，与 CLI 同 fixture 不可区分

## W5+ — 二套模板 / 模板市集 / 分享链接 / e2e / Playwright

（仅占位，详细任务在 W4 完成后拆。）

---

## 决策记录（ADR lite）

> 关键决策的来源追踪。新增决策时按下面格式加一行。

| 日期 | 决策 | 来源 |
|------|------|------|
| 2026-07-25 | CLI 命令名 `typsume`（不是 `cv`） | 用户 |
| 2026-07-25 | 所有配置 TOML（`typsume.config.toml` / `~/.config/typsume/config.toml`） | 用户 |
| 2026-07-25 | 模板元信息 `meta.toml`（不是 JSON） | 用户 |
| 2026-07-26 | schema version 字面量 `typst-resume/X.Y`（与项目名一致；旧 `cv/1.0` 已废弃） | 用户 |
| 2026-07-25 | 弃 Markdown DSL 路线 | 用户 |
| 2026-07-25 | CLI 用 typst.ts WASM（**不依赖系统 typst**），CLI 与 Web 共用 artifact | 用户 |
| 2026-07-25 | Web 选 React 19（不是 Vue），UI 用 shadcn/ui | 用户 |
| 2026-07-25 | CLI 运行时 Bun ≥ 1.4.0 + citty | 用户 |
| 2026-07-25 | 全局配置走 XDG：`~/.config/typsume/config.toml` | 用户 |
| 2026-07-25 | 工作流：PRD → TODO → 代码，PRD 始终是"最终预期"；无授权不写代码 | 用户 |

---

## Backlog（暂不动手，仅记录）

- [ ] 多语言简历（meta.locale 切模板）
- [ ] AI 改写（本地 Ollama 优先）
- [ ] ATS 评分
- [ ] 模板市集
- [ ] 自定义模板上传
- [ ] 账户 + 云同步（opt-in）
- [ ] 单 binary 分发（`bun build --compile`）
