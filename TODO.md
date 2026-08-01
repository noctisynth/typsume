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
  - `ItemBlockSchema`（`title, subtitle?, period?, department?, stack?: string[], links?: {label, href} [], body?, highlights: string[]` 默认 `[]`, `extra?`）
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
- [x] 新增 `examples/sample/resume.zh.json`（中文占位数据，覆盖典型结构与长标题换行）
- [x] 对齐原模板的 ItemBlock 语义：公司/职位、学校/专业映射，以及 experience `department` 补充信息行
- [x] 写最小的 typst.ts WASM smoke：通过 core schema → 写 JSON → typst.ts compile → 输出 PDF
- [x] DoD：default 模板对占位 fixture 成功输出 PDF

> **W2 偏离记录**：
> 1. **schema version 字面量**：`cv/1.0` → `typst-resume/1.0`（与项目名一致；旧 `cv` 已废弃，ADR 同步）。
> 2. **typst.ts API 选型**：cookery 文档里的 `NodeCompiler.create()` 在 0.7.0 已下线；改用底层 `createTypstCompiler() + init({ workspace, beforeBuild: [withAccessModel(...)] }) + compile({ format: pdf })`。
> 3. **AccessModel**：typst.ts 自带 `FetchAccessModel` 内部用 `XMLHttpRequest`（浏览器 API），Node 端无法使用；改用 `MemoryAccessModel`（注意其路径必须以 `/@memory/` 开头）。
> 4. **cfg 注入**：meta.toml 由 CLI/smoke 解析后切成 `cfg_colors.json / cfg_fonts.json / cfg_sizes.json / cfg_layout.json` 注入到虚拟 workspace；模板用 `json("cfg_*.json")` 读取。`length` 类型用 `eval(..., mode: "code")` 还原（typst 不接受 raw string 当 length）。
> 5. **可选字段访问**：schema optional 字段在 typst 里 `data.foo` 会"dictionary does not contain key"——必须用 `data.at("foo", default: none)`。
> 6. **字体（已废弃方案）**：曾把 Maple Mono NF CN 二进制放入 `templates/default/fonts/`；文件过大，已从 Git 历史移除。新方案由 `meta.toml.resources.fonts` 声明远程资源，编译器按需下载。
> 7. **Icons**：从 `../resume/icons/*.svg`（FontAwesome 4/5 风格）复制到 `templates/default/icons/`，完全沿用，不重新设计。
> 8. **layout 重写**：layout 与 helpers（resume, info, sidebar, item, space-between, tech, tech-stack, proficiency, date, icon, icons）沿用 `../resume/template.typ`；data-driven sections 直接 inline 进 `header` / `body` markup content block，沿用 `for ... in data.X [...]` + `it.at("key", default: ...)` 模式。**未抽 render-xxx 函数**——typst 0.13 的 `for` 在 `let f = {}` 块内返回 array（不是 content），会破坏 `stack({...})` 类函数调用，所以 sections 必须 inline 在 markup context。
> 9. **awards sidebar**：原 `../resume/resume.typ` 用 `stack({ linebreak(); linebreak(); v(0.8em); text(...) })` 是 `{}` code block + 简单函数调用。data-driven 时改成 `stack(for a in data.awards [content])`——`for` 表达式在 markup 上下文返回 content，`stack()` 接受 single content 作为 child。
> 10. **loadFonts 选项**：`loadFonts([], { assets: false })` 显式禁用 typst.ts 默认从 jsdelivr CDN 拉 NewCMMath-Bold.otf（沙盒环境无外网）。
> 11. **biome lints**：`biome.json` 在 `files.includes` 中排除 `templates/default/icons/*.svg`（a11y noSvgWithoutTitle）和 `templates/default/fonts/*.ttf`（格式）。
> 12. **模板资源挂载**：compiler 递归挂载模板根内的自包含资源（`meta.toml` 与字体除外）；字体继续走 `loadFonts` 专用通道，使 `basics.photo` 等相对模板根资源可用且 compiler 无需理解业务字段。
> 13. **layout / photo**：`cfg_layout.json` 中的 margin、gutter、side width 用 `eval(..., mode: "code")` 恢复为 Typst length；恢复原模板的可选头像渲染分支。

> **W2 退出条件已达成**：smoke 跑通英文样例 `72395 字节 / 1 页 PDF` 与中文样例 `122595 字节 / 1 页 PDF`。所有 sections（技术栈/荣誉/项目/实习/教育）+ 完整 helpers（item 三列 grid / space-between 时间对齐 / tech-stack + proficiency / sidebar 横向双列 / info monospace 多行）均渲染成功。

## W3 — `packages/cli`

- [x] citty 命令脚手架
- [x] `typsume build / validate / dump / templates / dev / init / help`
  - [x] 六个子命令与 citty 自动 help 已接入
  - [x] 命令级 smoke 与端到端测试
- [x] TOML 配置加载（项目 + `~/.config/typsume/config.toml`）
  - [x] 项目与 XDG 全局配置读取
  - [x] Zod 严格校验、配置覆盖顺序、`templates-dir` 与 `~` 展开
- [x] WASM 编译通道同进程（`MemoryAccessModel`，不创建磁盘临时 workspace）
- [x] 错误码 2–7 与可读 schema diagnostics 完整落实
- [x] `templates` 合并内置与全局自定义模板
- [x] `init → build`、`dev` 防抖与失败恢复验收
  - [x] `init` 默认生成 `resume.toml`，支持 `--format json|yaml|toml`
  - [x] 使用 `consola` 统一人类可读的 CLI 状态、警告与错误输出
  - [x] `build` 为长耗时的字体/WASM/Typst 阶段提供持续可见的进度反馈
  - [x] 构建阶段改为完成后输出 tick，最终产物使用相对路径展示
  - [x] 使用 `@clack/prompts` 将多行 tick 替换为 indicatif 式单行动态 spinner
  - [x] spinner 单独展示任务完成状态，Consola 单独展示最终产物
  - [x] 使用 `colorette` 为人类可读输出的路径、耗时和结果信息局部着色
  - [x] CLI 子进程测试使用独立临时 HOME/XDG，禁止把 Bun 缓存写入源码目录
  - [x] 交互策略测试隔离 `GITHUB_ACTIONS`，本地复现并覆盖 CI 环境
  - [x] `init` 交互询问并可生成 main push 构建、上传 PDF artifact 的 GitHub Actions workflow
- [x] 发布包：`@typsume/cli` + `typsume` bin + pack 内置模板；pnpm/npm/Bun 执行入口已对齐
- [x] 远程字体资源
  - [x] 下载前交互确认；`--allow-downloads` 与 `GITHUB_ACTIONS=true` 跳过交互并授权
  - [x] `meta.toml` 解析 `[[resources.fonts]]`（顺序镜像 + 可选 `sha256-<base64>`）
  - [x] 下载直接 TTF / OTF，使用 `fflate` 在内存中解压 ZIP 中的全部 TTF / OTF
  - [x] 从 source 定位项目根；以资源声明 SHA-256 为键缓存原始响应到 `.typsume/fonts/`
  - [x] 临时文件完整写入后原子重命名；损坏缓存显式告知并重新下载
  - [x] `init` 创建、`build` 补建 `.typsume/.gitignore`（内容为 `*`）
  - [x] 与模板本地字体合并后传给 typst.ts；ZIP 只在内存解压
  - [x] 所有异常路径说明当前问题与接下来的行为；全部镜像失败后继续尝试编译
  - [x] 为直接字体、ZIP、镜像回退、校验失败、无有效字体和日志 URL 脱敏补测试
- [x] DoD：CI 使用 Bun canary、执行 check/typecheck/test/build；线上发布流程由用户验收
- [x] `semifold-ci` 通过 setup Action 锁定 Semifold CLI `v0.3.0-beta.3`
- [x] 修复 npm OIDC 发布环境：固定受支持的 Node/npm、移除发布步骤传统 token、补齐发布包仓库元数据
- [x] 在 `semifold-ci` 安装 Bun canary，支持 CLI 的 `prepack` / `postpack` lifecycle

## W4 — `packages/web`

- [x] Vite + React 19 + shadcn-react + TailwindCSS 骨架；首页与编辑器异步分包
- [x] Web 工程约定：所有文件 kebab-case；组件仅在 `components/`；Zustand 仅在 `models/`
- [x] shadcn CLI 初始化并按需生成 `components/ui` 元组件；业务样式仅用 Tailwind utilities
- [x] 三栏布局（左表单 / 中预览 / 右大纲）与桌面端设计系统
- [x] Zustand + persist：当前简历草稿写入 IndexedDB，恢复时重新校验 schema
- [x] react-hook-form + zodResolver：覆盖 basics / skills / education / experience / projects / awards / meta
- [x] react-i18next：zh-CN / en-US 基础界面文案，简历内容保持原样
- [x] `typst.ts` 浏览器端集成 + 串行 renderer 适配组件实时预览 + PDF 导出
- [x] 默认模板构建时打包；模板注册表为 W5 第二套模板预留扩展点
- [x] 复用 CLI 字体资源契约：浏览器内下载、校验、ZIP 解压、页面生命周期复用和可见状态提示
- [x] 字体资源警告按问题列表垂直展示；保留 React StrictMode 并通过串行适配层防止 WASM renderer 重入
- [x] Web 远程字体失败后经 `queryLocalFonts()` 权限读取本地候选字体，并把实际 family 注入 Typst
- [x] Vitest 覆盖 store / 表单数据转换 / 字体资源异常路径，仓库 check/typecheck/test/build 全绿
- [x] 字体上传与选择：完整 TTF / OTF / TTC 经 typst.ts 解析内部 family，页面生命周期复用且不持久化
- [x] 修正 Local Font Access fallback：展示 family 仅用于候选匹配，Typst 配置使用字体内部 family
- [x] 浏览器资源边界：空照片路径归一化；不可访问路径显式告警并从本次预览数据移除
- [x] 结构导航只滚动左侧 ScrollArea viewport，重复点击不再移动 document root
- [x] 字体目录 / picker 调研结论同步：W4 不接入 WebFont CSS 分片，后续目录需完整字体与许可证设计
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
| 2026-07-31 | 大字体改为 `meta.toml` 远程资源；顺序镜像、可选 SHA-256、ZIP 解压，异常行为必须显式告知 | 用户 |
| 2026-08-01 | CLI 字体原始响应缓存到简历项目 `.typsume/fonts/`；声明摘要作键、原子写入、内联 `.gitignore`；Web 不持久缓存字体 | 用户 |
| 2026-08-01 | W2 不做主观视觉或像素级验收；以占位 fixture 成功输出 PDF 作为退出条件 | 用户 |
| 2026-08-01 | `ItemBlock.department?` 表示工作经历的部门/业务线；experience 渲染 department，projects 渲染 stack | 用户 |
| 2026-08-01 | CLI 保留 `MemoryAccessModel`；不实现磁盘临时 workspace、`--debug` 或 `typsume.log`，编译错误直接输出 stderr | 用户 |
| 2026-08-01 | CLI 发布包保持 `@typsume/cli`，bin 名为 `typsume`；pack 时从根 `templates/` 暂存内置模板，运行时保持 Bun | 用户 |
| 2026-08-01 | Web 支持页面生命周期字体上传/选择；Typst 字体配置以字体文件内部 family 为准，不直接采用浏览器展示名称 | 用户 |

---

## Backlog（暂不动手，仅记录）

- [ ] 多语言简历（meta.locale 切模板）
- [ ] AI 改写（本地 Ollama 优先）
- [ ] ATS 评分
- [ ] 模板市集
- [ ] 自定义模板上传
- [ ] 账户 + 云同步（opt-in）
- [ ] 单 binary 分发（`bun build --compile`）
- [ ] CLI `--offline`：显式跳过远程字体并提示后续行为
- [ ] 跨平台系统字体发现：CLI 扫描系统字体；Web 扩展 Local Font Access API 的候选与兼容性；不可静默 fallback
