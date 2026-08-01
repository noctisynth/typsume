# PRD — typst-resume

> 产品需求文档。  
> 实际项目名称暂定 `typst-resume`，可改。  
> 详细设计分别见：
> - 模板契约：[`docs/data-driven-template.md`](./data-driven-template.md)
> - CLI：[`docs/cli.md`](./cli.md)
> - Web：[`docs/web.md`](./web.md)

---

## 1. 一句话

让任何用户（包括不会 Typst 也不会写代码的人）通过浏览器或命令行，用结构化数据生成一份高质量、由 Typst 排版的可投递简历。

## 2. 问题

- 动机：现成的 Typst 简历模板质量好，但作者通常把字段直接 hardcode 在 `.typ` 源码里，**他人无法直接复用**，需要懂 Typst 才能改字段内容。本项目把"模板样式"与"简历数据"分离，让任何用户填一份 JSON / 填一份表就能得到同质量的 PDF。
- 现有生态：
  - `yamlresume` — YAML → LaTeX → PDF（中文断行、字体不如 Typst）
  - `typst.app` — 官方 SaaS，编辑体验好但闭源、需要登录、数据上传服务端
  - `Reactive Resume` — 在线表单 → JSON Resume → HTML（与 Typst 相比排版质量低）
- **市场缝隙**：Typst 优先、零后端、可源码管理、多模板。**yamlresume roadmap 上写明要做 Typst，但还没做。**

## 3. 目标用户

| 用户类型 | 入口 | 价值主张 |
|---------|------|---------|
| 求职者（普通） | Web | 浏览器填表 → 即得一份 Typst 排版的 PDF |
| 求职者（开发者） | CLI | YAML/JSON + git 版本管理 + CI 自动构建 |
| 模板作者 | 提交 PR | 一份模板文件夹就能被所有人用 |
| 招聘方 | 分享链接 | 收到 PDF 即看（不再依赖 Word 排版兼容性） |

## 4. 非目标（v1）

- 不做：账号、云同步、协作编辑
- 不做：AI 写简历（v2 再考虑）
- 不做：招聘信息抓取 / 一键投递
- 不做：ATS 解析评分（v2+）
- 不做：自定义 DSL 输入格式（CLI 只接受 JSON/YAML/TOML，DSL 路线已否决）

## 5. 核心架构

```
                 ┌─────────────────────────────────────────────┐
                 │              packages/core                   │
                 │   Zod schema · Template Contract · Types    │
                 └────────────────┬────────────────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                       ▼
                 ┌─────────────┐                          ┌─────────────┐
                 │  packages/  │                          │  packages/  │
                 │     cli     │                          │     web     │
                 │   (Bun +    │                          │  (React 19) │
                 │    citty)   │                          │             │
                 └──────┬──────┘                          └──────┬──────┘
                        │ typst.ts WASM (Node 端)              │ typst.ts WASM (浏览器)
                        ▼                                       ▼
                  ┌─────────┐                              ┌─────────┐
                  │   PDF   │                              │   PDF   │
                  └─────────┘                              └─────────┘
```

- **唯一真相**：`packages/core` 中的 Zod schema + 模板目录结构
- **两条独立管线**：CLI 和 Web 用户群不重叠，输入格式分开设计，**共用相同的 schema 校验与相同的模板**
- **templates 外置**：`templates/<name>/` 是各模板自包含文件夹，可被 CLI 和 Web 共用

详细分设计见子文档：
- 模板契约：[`docs/data-driven-template.md`](./data-driven-template.md)
- CLI：[`docs/cli.md`](./cli.md)
- Web：[`docs/web.md`](./web.md)

## 6. 仓库结构

```
typst-resume/
├── docs/                                # 设计文档（本目录）
├── packages/
│   ├── core/                            # ✅ schema · types · template contract（Zod + JSON Schema 7）
│   ├── cli/                             # `typsume` 命令（Bun + citty）
│   └── web/                             # React 19 编辑器
├── templates/
│   └── default/                         # v1 必备，参考一份高质量中文 typst 简历样式
├── examples/                            # 示例简历
├── package.json                         # bun workspaces（根包）
└── README.md
```

## 7. 数据契约（一览）

完整定义 [`docs/data-driven-template.md`](./data-driven-template.md) §3。概要：

```ts
type ResumeData = {
  schema:    'typst-resume/1.0'
  basics:    { name, title?, photo?, contacts[] }
  skills:    { name, items: { name, level? }[] }[]
  education: Item[]
  experience: Item[]
  projects:  Item[]
  awards:    { title, date, level? }[]
  meta?:     { template?, locale?, fontSize? }
}

type Item = {
  title, subtitle?, period?, department?, stack?[],
  links?: { label, href }[],
  body?, highlights: string[],
  extra?: Record<string, unknown>
}
```

`experience` 中 `title` 表示公司/组织，`subtitle` 表示职位，`department` 表示部门或业务线；
`projects` 中 `title` 表示项目名，`subtitle` 表示项目来源，`stack` 表示技术栈或项目标签。
default 模板将 experience 的 `department` 与 projects 的 `stack` 渲染在原模板 `#tech[...]`
所在的补充信息行。

## 8. 里程碑

详见三份子文档的"验证清单（DoD）"。**总里程碑**：

| W | 范围 | 出口 | 状态 |
|---|------|------|------|
| W1 | packages/core 起架 + Zod schema + types（Bun workspace） | 单元测试通过 | ✅ |
| W2 | templates/default 改造 + typst.ts WASM smoke | 占位 JSON 成功输出 PDF | ✅ |
| W3 | packages/cli MVP（Bun + citty） | `typsume build / validate / dump / templates / init / dev` 可用 | ▶ |
| W4 | packages/web 起架 + typst.ts 集成 + 表单 + 实时预览 | 浏览器填表出 PDF | |
| W5 | 第二个模板 + IndexedDB 多版本 + 国际化 + e2e | 提 PR 给简历圈 | |

## 9. 风险与决策记录

| # | 风险 | 当前决策 | 备选 |
|---|------|---------|------|
| R1 | Markdown DSL 设计曾被考虑，**被否决**（用户明确不采纳） | 仅 JSON / YAML / TOML 输入 | 未来仍可探索，但不在 v1 范围 |
| R2 | typst.ts WASM 体积大（~5MB） | 首屏不加载，进入编辑器按需加载 + 子集字体 | v1.1 考虑 Service Worker 缓存 |
| R3 | Zod → JSON Schema 同步偏移 | CI 中 `schema.test.ts` 双向校验 | Zod 4 内置 `z.toJSONSchema()`，直接推导，无 drift 风险 |
| R4 | 多端 schema drift | `packages/core` 是 workspace 公共依赖，monorepo 强约束 | 包版本锁 + CI 校验 |
| R5 | 自定义模板上传 v1 不做 | 模板作者通过 PR 贡献 | v2 做模板市集 |
| R6 | CLI 分发/单 binary | 发布包 `@typsume/cli`，bin 名 `typsume`；pnpm/npm/Bun 均可安装或执行，运行时仍需 Bun；pack 时把根 `templates/` 暂存进包（**用户无需安装 typst**） | v1.1 用 `bun build --compile` 出单 binary；v2 可选 Rust 重写 |
| R7 | 中文字体文件体积过大，不适合进入 Git 历史 | 模板在 `meta.toml` 声明远程字体资源；CLI 下载到简历项目内的 `.typsume/fonts/`，Web 只在页面生命周期内复用 | 后续增加 `--offline` 与跨平台系统字体发现 |
| R8 | 远程字体不可用会改变排版或导致编译失败 | 每个异常步骤必须说明原因与接下来的行为；镜像全部失败后继续尝试编译，并明确提示当前阶段不保证系统字体可用 | 后续实现 CLI / Web 系统字体加载 |
| R9 | Semifold latest 变化导致发布 CI 行为漂移 | `semifold-ci` 通过 setup Action 的 `version` 输入锁定 `v0.3.0-beta.3` | 经验证后显式升级固定版本 |
| R10 | npm Trusted Publishing 未触发会回退到传统 token 并以 `ENEEDAUTH` 失败；CLI 的 npm lifecycle 依赖 Bun | 发布 job 固定 Node 24（npm 11.5.1+）并安装 Bun canary，授予 `id-token: write`，发布步骤不注入写 token；每个发布包声明与 workflow 仓库一致的 `repository` | 私有依赖安装可单独使用只读 token，但不得传入发布步骤 |

## 10. 成功指标

| 指标 | 目标 |
|------|------|
| Web 端构建→预览延迟 P85 | < 300ms |
| PDF 与 CLI 像素级一致（同一 JSON） | 100% |
| Star（GitHub，6 个月内） | ≥ 200 |
| 模板市集上线前内置模板数 | ≥ 3 |

## 11. 许可证

- 代码：MIT（与 yamlresume 一致，降低品牌切换摩擦）
- 默认模板：MIT
- 用户内容：用户所有，不上传任何服务器（隐私设计核心卖点）

## 12. 后续规划（v2+，仅记录）

- 模板市集 + Web 上传
- 账户 + 云同步（可选 opt-in）
- AI 改写（本地 Ollama 优先，云端 LLM 备选）
- 多语言简历（非 i18n UI，是 `meta.locale` 切换模板区域版本）
- ATS 评分
- 投递记录 / 链接追踪
