# AGENTS.md

> 给本项目工作的 AI agent 必读。**进入工作流之前先通读本文件**。

---

## 0. 项目速览

| 项 | 值 |
|----|----|
| 项目名 | `typst-resume` |
| CLI 二进制名 | `typsume` |
| 包管理 | Bun ≥ 1.4.0（workspaces 单仓库） |
| 目标 | 让任何人通过浏览器或 CLI 用结构化数据生成 Typst 排版的简历 PDF |

权威设计文档：
- [`docs/PRD.md`](./docs/PRD.md) — 产品需求 / 架构 / 仓库结构 / 里程碑 / 风险 / 决策记录
- [`docs/data-driven-template.md`](./docs/data-driven-template.md) — 模板契约、JSON 数据契约、迁移步骤
- [`docs/cli.md`](./docs/cli.md) — `typsume` CLI 设计
- [`docs/web.md`](./docs/web.md) — React 19 + shadcn/ui Web 端设计

---

## 1. 硬性规则（不可被覆盖）

### 1.1 文档优先（Document-first）

> 任何阶段开始的前提：**文档反映的是"最终预期效果"，不是"当前已实现"**。
> 文档不需要等到代码做完才能改，文档始终走在代码前面。

工作顺序永远是：

```
PRD (更新设计 / 决策)
  ↓
TODO (拆任务并标记状态)
  ↓
代码 (实现)
  ↓
测试 + lint + 自检
  ↓
更新 TODO 完成标记；若有偏离，回 PRD
```

任何时候发现以下矛盾，**立刻停下来改文档**：
- 用户意图和 PRD 不一致 → 更新 PRD，再继续
- PRD 与子文档（cli.md / web.md / data-driven-template.md）冲突 → 以 PRD 为准，修子文档
- 子文档之间冲突 → 提出问题，等用户决断

### 1.2 不写代码不请示

> 用户的明确说"开始写代码 / 实现 / 落地"之前，**不得**：
> - 写或改任何 `.ts` / `.tsx` / `.js` / `.json` 配置（package.json / tsconfig.json / biome.json 等）
> - 跑 `bun install` / `bun add` / `bun init`
> - 创建目录骨架（mkdir packages/core 等）
> - 跑 `bun run` / `bunx`
> - 改任何 markdown 文件之外的产物

只读操作（grep / read / glob / search）任何时候都允许。

### 1.3 不发明东西

- 不要替用户选 doc 里没有的第三方库 / 版本号
- 不要替用户起名字、改 schema 形状、加 feature
- 设计层面有疑问先回到文档；如果文档没写，**先停下问用户**

### 1.4 命名一致性

多份 doc 之间的命名、术语、技术栈表述必须一致。发现冲突时立刻指出，不要擅自二选一。

### 1.5 隐私

- 不要在任何 markdown / 注释 / commit message / chat 中**复述**用户的真实姓名、邮箱、GitHub handle 等 PII
- 例子与 fixture 一律使用明显的人造数据（占位姓名如 `"Xxx Yyy"`、占位邮箱 `name@example.com`），与真实用户的同名字段不重复
- 仓库示例目录用占位名（如 `examples/sample/`），不要带可识别的真实用户名

---

## 2. 单轮任务工作流

| 步骤 | 动作 |
|------|------|
| 1 | 阅读相关 doc 子集（PRD + 涉及的子文档 + TODO 当前对应段落） |
| 2 | 如果用户意图 ≠ doc，先用只读修改 PRD（标记"PRD 待 user 拍板"），不要直接动代码 |
| 3 | **用户授权后**才动代码 |
| 4 | 写完同步更新对应 TODO 状态 |
| 5 | 跑代码自检（lint / type-check / test，按项目已有约定） |

---

## 3. 技术栈速查（与 [`docs/PRD.md`](./docs/PRD.md) / [`docs/cli.md`](./docs/cli.md) / [`docs/web.md`](./docs/web.md) 同步）

| 维度 | 选型 |
|------|------|
| 运行时 + 包管理 | Bun ≥ 1.4.0 |
| CLI 框架 | citty |
| Web 框架 | React 19 + TypeScript |
| 构建 | Vite（Web 端）/ bun 原生（CLI / core） |
| UI | shadcn/ui + TailwindCSS |
| 状态 | Zustand + persist middleware |
| 表单 | React Hook Form + `@hookform/resolvers/zod` |
| Schema | Zod（单一真相）→ 派生 JSON Schema + 类型 + 表单 |
| 验证 | Vitest（unit）+ Playwright（e2e） |
| 国际化 | react-i18next |
| Typst 编译 | `@myriaddreamin/typst.ts` WASM（CLI + Web 共用，**不依赖系统 typst**） |
| 配置 | TOML（项目 + `~/.config/typsume/config.toml`） |
| 模板元信息 | `templates/<name>/meta.toml` |

---

## 4. 文件 / 目录契约

```
typst-resume/
├── docs/                           # 设计文档（权威，先于代码）
├── AGENTS.md                       # 本文件
├── TODO.md                         # 任务清单（活文档）
├── package.json                    # bun workspaces（根包）
├── tsconfig.base.json              # 跨包 TS 共享基线
├── biome.json                      # lint + format（与 Biome 生态一致）
├── .gitignore
├── packages/
│   ├── core/                       # Zod schema + types + JSON Schema 派生
│   ├── cli/                        # typsume CLI（暂不实现）
│   └── web/                        # React 19 编辑器（暂不实现）
├── templates/
│   └── default/                    # v1 必备的默认 typst 模板
└── examples/
    └── sample/                     # 公开示例与测试 fixture（占位数据）
```

**不允许**：
- 跨包相对路径引用（必须 workspace 软链）
- 在根目录散落 `*.ts`（除非是配置脚本且 TODO 列出）
- 在没有 doc 支撑时新建 `docs/` 之外的子目录

---

## 5. 禁用清单

- ❌ 在没有 PRD 更新时改代码
- ❌ 没有明确代码授权时执行 `bun install` / `bun add` / `bunx`
- ❌ 创建 README.md / CHANGELOG.md（除非用户明确要求）
- ❌ 引入 doc 里没有的依赖
- ❌ 在终端输出 emoji（除非用户要求）
- ❌ 自己选定 schema 字段名 / 第三方库替代 / 命名空间

---

## 6. 工件：什么时候停下来等用户

| 触发 | 动作 |
|------|------|
| 用户没说"开始写代码" | 只读，不动文件系统 |
| 用户给了超出 TODO 范围的需求 | 先更新 TODO，再走代码 |
| 发现 doc 互相矛盾 | 列出冲突，等用户决断 |
| 实现需要 doc 没记录的设计决策 | 先停下来问 |
| 用户提交"问题挺多"但没说改什么 | 只列问题清单，不擅自决定优先级 |
