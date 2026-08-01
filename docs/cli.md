# CLI Design (packages/cli)

> CLI 工具 `typsume` 的设计文档。面向开发者 / 高级用户，内置 `typst.ts` WASM 编译生成 PDF。
> **用户无需本地安装 typst**——`bun add -g typsume` 即可使用。
> 数据流与 schema 契约详见 [`docs/PRD.md`](./PRD.md) 与 [`docs/data-driven-template.md`](./data-driven-template.md)。

---

## 1. 目标与定位

- **用户**：会用 shell、想要"简历即代码"流程的用户（git 管理简历、CI 自动构建、模板实验）
- **不做**：可视化编辑、所见即所得预览（这是 Web 的事）
- **做**：源文件 → 校验 → 生成 PDF / 调试产物

## 2. 技术栈

- **运行时 + 包管理器**：`bun` ≥ 1.4.0（同时承担运行与依赖管理）
  - Bun 原生支持 TypeScript / ESM，无需 tsx / ts-node
  - 通过 `package.json#workspaces` 管理 monorepo
  - 后续可用 `bun build --compile` 打包成单 binary 分发（v1.x 考虑）
- **CLI 框架**：[`citty`](https://github.com/unjs/citty)（unjs 出品，声明式 + ESM-first，体积小）
- **终端交互与日志**：`consola` + `colorette`；人类可读状态使用 success/info/warn/error，并对路径、耗时等关键信息局部着色；JSON 等机器输出保持纯 stdout
  - `build` 在输入校验、模板解析、字体准备、WASM 初始化、Typst 编译与 PDF 写入阶段持续报告进度，避免长时间静默
- **与 Web 共享**：`packages/core`（Zod schema + types），通过 workspace 软链
- **typst 编译**：[`@myriaddreamin/typst.ts`](https://github.com/Myriad-Dreamin/typst.ts) Node.js 端 WASM  
  - **关键收益**：用户零外部依赖。`bun add -g typsume` 即装即用，**不需要系统装 typst**
  - 与 Web 端共用同份 WASM artifact，避免线上/本地渲染路径分裂
  - 编译产物（artifact / PDF）二进制返回给 caller

> 与 web 一致：仍然是 TypeScript 单栈。Bun runtime 已经覆盖了大量 Node API 需求，不引入第二个工具链。  
> 备选：未来如果有强性能/单 binary 需求，可以 Rust + clap 重写 CLI，不必改架构。

## 3. 命令设计

通过 `citty` 的 `defineCommand` 声明式定义：

```ts
// packages/cli/src/commands/build.ts
import { defineCommand } from "citty"

export default defineCommand({
  meta: { name: "build", description: "编译 source 到 PDF" },
  args: {
    source:      { type: "positional", required: true, description: "JSON / YAML / TOML 源文件" },
    template:    { type: "string",  alias: "t",          description: "模板名或路径" },
    output:      { type: "string",  alias: "o",          description: "输出 PDF 路径" },
    strict:      { type: "boolean", default: false,      description: "严格校验模板 requiredFields" },
    "dry-run":   { type: "boolean", default: false,      description: "只跑校验 + dump 中间产物" },
  },
  async run({ args }) { /* ... */ }
})
```

顶层入口聚合：

```ts
// packages/cli/src/main.ts
import { defineCommand, runMain } from "citty"
import build from "./commands/build"
import validate from "./commands/validate"
import dump from "./commands/dump"
import templates from "./commands/templates"
import dev from "./commands/dev"
import init from "./commands/init"

const main = defineCommand({
  meta: { name: "typsume", version: "0.1.0", description: "..." },
  subCommands: { build, validate, dump, templates, dev, init },
})

runMain(main)
```

运行：

```bash
bun run typsume <command> [options]
```

用户安装或临时执行发布包（运行时仍需 Bun）：

```bash
pnpm add -g @typsume/cli
pnpm dlx @typsume/cli --help
npx @typsume/cli --help
bunx @typsume/cli --help
typsume build resume.json
```

发布包通过 `package.json#bin.typsume` 固定命令名。根目录 `templates/` 是内置模板单一源码；
`prepack` 把它暂存到 CLI 包内，`postpack` 清理暂存目录。resolver 在发布包中读取包内
`templates/`，monorepo 开发时回退仓库根目录。

## 4. `typsume build` 详细规范

```
typsume build <source> [options]

Options:
  -t, --template <name|path>   模板名（来自 templates/）或本地路径
  -o, --output <file>          输出 PDF 路径，默认 <source-stem>.pdf
  --strict                     严格模式：缺任何 meta.toml.requiredFields 即报错
  --dry-run                    只跑 schema 校验 + dump 中间产物（resume.json）
  --allow-downloads            无交互授权远程字体下载（GitHub Actions 环境自动授权）
```

**示例**：
```bash
typsume build resume.json                       # default 模板输出 resume.pdf
typsume build resume.json -t modern
typsume build my.yaml -t ./my-template -o out.pdf
typsume build resume.json --dry-run
```

### 4.1 `typsume init`

```text
typsume init [dir] [--format json|yaml|toml] [--github-actions|--no-github-actions]
```

`init` 默认生成 `resume.toml`；`--format` 可以改为 `resume.json` 或 `resume.yaml`。三种文件
表达相同的 `ResumeData`，并共用同一份 Zod schema。命令同时创建 `typsume.config.toml` 与
`.typsume/.gitignore`，且不覆盖已经存在的目标文件。

交互终端中，`init` 询问是否生成 `.github/workflows/resume.yml`。确认后，workflow 在每次
push 到 `main` 时运行 `typsume build <source> --allow-downloads`，并通过
`actions/upload-artifact@v4` 上传 `resume.pdf`。脚本或非交互环境使用
`--github-actions` / `--no-github-actions` 显式选择；未指定时不生成 workflow。

### 4.1 源文件格式

支持以下输入（按扩展名识别，无扩展名视作 JSON）：

| 扩展名 | 处理 |
|--------|------|
| `.json` | 直接读 + 校验 |
| `.yaml` / `.yml` | `js-yaml` 解析 → 校验 |
| `.toml` | `@iarna/toml` 解析 → 校验 |
| `.typ` | **暂不直接支持**（Web/CLI 之间互不交集，用户不会用 .typ 走 CLI） |

> 说明：CLI 不打算支持自定义 DSL / Markdown source。CLI 用户接受 JSON / YAML / TOML。复杂输入请走 Web。

### 4.2 执行流程

```
1. parse   argv & 输入扩展名识别
2. read    读取 source bytes
3. parse   转 JSON object
4. schema  Zod validate → 失败打印 path + message，exit 1
5. template meta check  --strict 时校验 requiredFields
6. fonts   读取本地字体；按 meta.toml 顺序下载、校验并解压远程字体资源
7. compile 同进程调用 @myriaddreamin/typst.ts，传入模板路径、resume.json 与字体字节
8. write   把返回的 PDF bytes 写到 -o 指定路径
9. cache   有效下载原子写入项目 `.typsume/fonts/`，供后续 build 复用
10. exit   0
```

WASM init 懒加载：首次 build 才初始化 typst renderer，避免冷启动拖累 help / templates 等元命令。

远程字体在首次实际下载前请求用户确认；已有有效缓存时不询问。`--allow-downloads` 显式授权
脚本环境下载；检测到 `GITHUB_ACTIONS=true` 时同样自动授权并跳过交互。其他非交互环境若没有
显式授权则报错，不静默联网。每个资源按 `meta.toml` 的 `urls` 顺序尝试；直接字体和 ZIP 均在
内存中处理。CLI 把原始响应缓存在简历项目的 `.typsume/fonts/`，不缓存解压结果。

简历项目根从 source 文件所在目录向上查找最近的 `typsume.config.toml`；找不到时使用 source 所在
目录。缓存键由有序 URL 列表和可选 integrity 的 SHA-256 生成。下载使用同目录临时文件并在完整
读取和校验后原子重命名，因此只有最终文件存在才代表下载完成。缓存损坏时明确告知将重新下载。
`typsume init` 创建 `.typsume/.gitignore`，内容为 `*`；`build` 兼容旧项目并在缺失时补建。
没有 integrity 时，上游在同一 URL 更新不会自动失效，删除 `.typsume/fonts/` 即可显式刷新。

任何非预期资源行为都必须写到 stderr，并同时说明下一步。例如：当前镜像失败后将尝试下一个、
所有镜像失败后将不加载该字体并继续编译。后者可能改变排版，也可能因没有可用字体而编译失败；
当前版本不声称自动加载系统字体。日志中的 URL 隐去 query 和 fragment。

后续 `--offline` 会显式跳过远程字体；它必须告知用户接下来只会使用已加载的本地/系统字体。
跨平台系统字体发现与加载另列 TODO，不属于当前远程下载修复。

错误信息必须可读：
```
✗ schema validation failed at skills[0].items[2].level
  expected: "精通" | "熟悉" | "了解" | undefined
  received: "略懂"
```

### 4.3 内存 workspace

CLI 使用 typst.ts 的 `MemoryAccessModel` 构建虚拟 workspace。normalized `resume.json`、模板文件、
图标以及 `cfg_*.json` 只写入内存，不创建磁盘临时目录。字体字节通过 `loadFonts` 注入；只有远程
字体原始响应按资源缓存契约写入项目 `.typsume/fonts/`。

CLI 不提供 `--debug` 或 `typsume.log`。编译失败时把可读 diagnostics 直接写到 stderr；需要额外
诊断信息时通过 issue 提供复现输入和环境信息。

## 5. `typsume dev` watch 模式

- 监听 source 文件变更
- 防抖 300ms 后重建
- 输出上一次 build 的耗时与状态
- 不做浏览器 preview（CLI 不做 Web 集成）

## 6. `typsume templates`

读取 `templates/*/meta.toml`，打印成表格：

```
NAME       DISPLAY          REQUIRED FIELDS          THEME COLOR
default    默认简历         basics.name              #0b628b
modern     现代风格         basics.name              #1f2937
```

加 `--json` 输出 JSON 供其他工具消费。

## 7. 配置

配置文件用 **TOML**（与 Bun 生态、fmt/biome/starship 等保持一致）。解析用 `@iarna/toml`（Bun 内置也支持）。

### 7.1 项目级 `typsume.config.toml`（可选）

```toml
# 项目根
template = "default"
output   = "build/resume.pdf"

[build]
strict = false     # CLI 全局 --strict 开关
```

命令行参数覆盖配置文件。

### 7.2 全局 `~/.config/typsume/config.toml`

遵循 **XDG Base Directory** 规范。`$XDG_CONFIG_HOME` 未设置时回退到 `~/.config`。

```toml
templates-dir = "~/typsume-templates"
```

CLI 的模板搜索顺序：**命令行的 `-t <path>` > 项目 `typsume.config.toml` > 全局 `~/.config/typsume/config.toml` > 内置 `templates/`**。

### 7.3 Schema 校验

解析完 TOML 后对配置也跑一次 Zod schema（与简历数据共用 schema 体系）。非法键值直接报错，不静默忽略，避免"写了不生效"的调试痛苦。

## 8. 错误码

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 1 | 通用失败 |
| 2 | 输入文件读取失败 |
| 3 | 解析失败 |
| 4 | schema 校验失败 |
| 5 | 模板未找到 |
| 6 | typst.ts WASM 初始化失败（极少出现，仅极端环境下如 Bun 拒绝 load WASM） |
| 7 | typst 编译失败（含错误摘要） |

方便 CI 集成。

## 9. CI / 程序化使用示例

GitHub Actions：
```yaml
- uses: actions/checkout@v4
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: canary
- run: bun install
- run: bun run typsume build resume.yaml -t modern
- uses: actions/upload-artifact@v4
  with:
    path: resume.pdf
```

## 10. 验证清单（DoD）

- [x] `typsume init` 默认生成可编译的 `resume.toml`，并支持 `--format json|yaml|toml`
- [ ] `typsume build resume.json` 成功输出 PDF（与 Web 同一份 fixture 对齐）
- [ ] `typsume validate` 对错误输入给出上述可读错误
- [ ] `typsume dev` 在 watch 时变更即重建
- [ ] `typsume templates` 显示内置 + 用户自定义
- [ ] CI demo workflow 可跑通
- [ ] **零外部依赖**：CI 在全新 ubuntu-latest 镜像（除 bun 外不预装任何东西）能直接 build
