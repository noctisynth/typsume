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
import templateInfo from "./commands/template-info"
import dev from "./commands/dev"
import init from "./commands/init"

const main = defineCommand({
  meta: { name: "typsume", version: "0.1.0", description: "..." },
  subCommands: { build, validate, dump, templates, dev, init, template: templateInfo },
})

runMain(main)
```

运行：

```bash
bun run typsume <command> [options]
```

用户安装全局包后：

```bash
bun add -g typsume            # 首选 Bun 全局安装
typsume build resume.json
```

## 4. `typsume build` 详细规范

```
typsume build <source> [options]

Options:
  -t, --template <name|path>   模板名（来自 templates/）或本地路径
  -o, --output <file>          输出 PDF 路径，默认 <source-stem>.pdf
  --strict                     严格模式：缺任何 meta.toml.requiredFields 即报错
  --dry-run                    只跑 schema 校验 + dump 中间产物（resume.json）
```

**示例**：
```bash
typsume build resume.json                       # default 模板输出 resume.pdf
typsume build resume.json -t modern
typsume build my.yaml -t ./my-template -o out.pdf
typsume build resume.json --dry-run
```

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
6. compile 同进程调用 @myriaddreamin/typst.ts 的 compiler.render()，传入模板路径 + resume.json
7. write   把返回的 PDF bytes 写到 -o 指定路径
8. clean   清理临时目录
9. exit    0
```

WASM init 懒加载：首次 build 才初始化 typst renderer，避免冷启动拖累 help / templates 等元命令。

错误信息必须可读：
```
✗ schema validation failed at skills[0].items[2].level
  expected: "精通" | "熟悉" | "了解" | undefined
  received: "略懂"
```

### 4.3 临时目录布局

CLI 不在用户当前目录写中间产物。运行时在 `os.tmpdir()/typsume-<hash>/` 下创建：

```
typsume-<hash>/
├── resume.json     # normalized 后的数据
└── template/       # 模板副本（如果源模板在仓库内）
```

typst.ts WASM 在编译失败时抛出的错误信息统一在 `typsume.log` 收集（如果 --debug 开启时落盘）。`--debug` 默认 false，错误直接打到 stderr。

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
    bun-version: 1.4.0
- run: bun install
- run: bun run typsume build resume.yaml -t modern
- uses: actions/upload-artifact@v4
  with:
    path: resume.pdf
```

## 10. 验证清单（DoD）

- [ ] `typsume init` 在空目录生成可编译的最小示例
- [ ] `typsume build resume.json` 成功输出 PDF（与 Web 同一份 fixture 对齐）
- [ ] `typsume validate` 对错误输入给出上述可读错误
- [ ] `typsume dev` 在 watch 时变更即重建
- [ ] `typsume templates` 显示内置 + 用户自定义
- [ ] CI demo workflow 可跑通
- [ ] **零外部依赖**：CI 在全新 ubuntu-latest 镜像（除 bun 外不预装任何东西）能直接 build
