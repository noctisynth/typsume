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
  meta?:     { template?, locale? }
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

Web 必须支持导入、导出 JSON/YAML/TOML，三种格式只表达 `ResumeData`。渲染样式不属于简历
内容：模板默认值来自 `meta.toml[config]`，CLI 用户覆盖写入 `typsume.config.toml[config]`，Web
使用独立的持久化样式模型；不得把样式字段写入 `ResumeData.meta`。

## 8. 里程碑

详见三份子文档的"验证清单（DoD）"。**总里程碑**：

| W | 范围 | 出口 | 状态 |
|---|------|------|------|
| W1 | packages/core 起架 + Zod schema + types（Bun workspace） | 单元测试通过 | ✅ |
| W2 | templates/default 改造 + typst.ts WASM smoke | 占位 JSON 成功输出 PDF | ✅ |
| W3 | packages/cli MVP（Bun + citty） | `typsume build / validate / dump / templates / init / dev` 可用 | ✅ |
| W4 | packages/web 起架 + typst.ts 集成 + 表单 + 实时预览 | 浏览器填表出 PDF | ▶ |
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
| R7 | 中文字体文件体积过大，不适合进入 Git 历史 | 模板在 `meta.toml` 声明远程字体资源；CLI 下载到简历项目内的 `.typsume/fonts/`，Web 先按页面生命周期复用，失败后经浏览器权限读取本地候选字体 | 后续增加 CLI `--offline` 与跨平台系统字体发现 |
| R8 | 远程字体不可用会改变排版或导致编译失败 | 每个异常步骤必须说明原因与接下来的行为；Web 远程失败后用 `queryLocalFonts()` 按显式候选顺序读取本地字体字节，再由 typst.ts 解析字体内部 family 后注入；API 不可用、拒绝授权或无匹配时继续编译并告警 | CLI 后续实现系统字体加载 |
| R9 | Semifold latest 变化导致发布 CI 行为漂移 | `semifold-ci` 通过 setup Action 的 `version` 输入锁定 `v0.3.0-beta.3` | 经验证后显式升级固定版本 |
| R10 | npm Trusted Publishing 未触发会回退到传统 token 并以 `ENEEDAUTH` 失败；CLI 的 npm lifecycle 依赖 Bun | 发布 job 固定 Node 24（npm 11.5.1+）并安装 Bun canary，授予 `id-token: write`，发布步骤不注入写 token；每个发布包声明与 workflow 仓库一致的 `repository` | 私有依赖安装可单独使用只读 token，但不得传入发布步骤 |
| R11 | CLI 不应静默联网，CI 又不能等待交互 | 本地字体下载前确认；`--allow-downloads` 或 `GITHUB_ACTIONS=true` 显式/环境授权；`init` 可生成 main push 构建并上传 PDF artifact 的 workflow | Web 端另行设计权限提示 |
| R12 | 浏览器 WebFont CDN 通常提供 CSS 与 unicode-range WOFF2 分片，不能直接作为完整 Typst 字体 | W4 支持用户上传完整 TTF / OTF / TTC 并选择由 typst.ts 识别出的内部 family；字节只保留在页面生命周期。字体目录可参考 Fontsource / Google Fonts 元数据，但不在 W4 引入第三方 picker 或把 CSS 分片交给 Typst | 后续设计带许可证、完整字体文件与缓存策略的字体目录 |
| R13 | `basics.photo` 的项目相对路径需要在 CLI/Web 两套内存文件系统中安全挂载，纯数据导出又不携带图片字节 | 保持路径语义；Web 上传 PNG/JPEG 后使用 `assets/<安全文件名>`，图片字节独立持久化；项目 ZIP 包含 `resume.toml`、`typsume.config.toml` 与图片；CLI 只读取并挂载项目根内由 `basics.photo` 引用的文件 | 纯 JSON/YAML/TOML 继续只导出数据，缺少图片时明确提示重新上传或补齐资产 |
| R14 | renderer WASM 的 `renderToSvg()` 在 Rust 借用期间直接回调 DOM，StrictMode 重放或 SVG DOM 操作可能触发 wasm-bindgen 所有权 panic | 预览使用串行 `renderSvg()` 只取得 SVG 字符串，每个任务复制 artifact 字节；Rust 调用结束后再由 React 侧挂载到 detached DOM。任何 renderer 异常后丢弃该实例 | 上游修复并验证后再评估直接 DOM renderer |
| R15 | typst.ts 0.7.0 仍以旧位置参数调用新版 wasm-bindgen 初始化器，且完整 SVG 默认携带运行时脚本 | Web 通过 `getModule()` 传入 `{ module_or_path }` 单对象；静态简历预览只请求 body / defs / CSS，不包含 renderer JavaScript | 升级 typst.ts 后复核并移除兼容层 |
| R16 | private Web workspace 未登记到 Semifold 时，其 changeset 会使发布 CI 校验失败；根 workspace 若被登记则会产生无意义的 GitHub Release | 登记 `@typsume/web`，由 `package.json#private` 阻止 npm 发布；明确不登记 `@typsume/workspace`，避免根 workspace 进入 release 流程 | package workspace 增删后同步配置，并从结果中排除仓库根包 |
| R17 | Radix vertical Separator 的 stretch 对齐与固定高度组合会贴到 header 顶部；Accordion Content 的 overflow 会裁掉 Card 外扩 ring | header 短分割线显式居中；Accordion 内容为 Card ring 在上、右侧保留 1px 内边距 | 若组件库升级改变默认样式，按实际 box model 复核 |
| R18 | GitHub Pages 项目站点位于仓库子路径，Vite 绝对资源路径和 BrowserRouter 直达路由可能 404 | Pages workflow 将 `configure-pages` 的 `base_path` 注入 Vite，Router 使用 `import.meta.env.BASE_URL`；产物复制 `index.html` 为 `404.html` 提供 SPA fallback | 自定义域名启用后 `base_path` 自动为空，无需改代码 |
| R19 | Web 当前把字号放在 `ResumeData.meta`，CLI 又忽略它；模板其余颜色、字体、字号和布局只来自 `meta.toml` | core 定义 `config` 覆盖与合并契约；模板 `meta.toml[config]` 提供默认值，CLI 项目 `typsume.config.toml[config]` 覆盖，Web 用独立 Zustand 模型；数据导入导出不携带样式 | custom template 继续遵循同一 config key 契约 |
| R20 | CLI 使用的 `@iarna/toml` 打入浏览器会引入 Node `stream`、直接 `eval` 警告和额外体积 | Web 运行时 TOML 导入导出使用 ESM `smol-toml`；CLI 与 Vite 构建期继续使用 `@iarna/toml` | 两端以相同 fixture 做语义往返测试，不要求使用同一 parser 实现 |
| R21 | Radix Accordion 内容层固定首次测量高度会裁切动态新增条目；荣誉时间轴按总高度画线导致单项长线与重复年份 | Accordion 只在动画层使用测量高度，内容保持 auto；荣誉按首次出现顺序按年份分组，每年渲染一次日期与多个奖项；日期、标记和奖项标题按同一水平基线对齐，以短标记替代整段高度线 | 动态数组增删必须覆盖展开状态下的容器回流 |
| R22 | 数据格式操作全部平铺在顶栏会挤占空间；编辑器残留英文固定文案；空数组仍生成空 section 标题 | 导入保留在左栏内容标题；右上角以一个下载菜单提供 TOML/JSON/YAML，与 PDF 并列；CLI 编译提示属于整个格式菜单；排版设置提供可复制的完整 `typsume.config.toml`；编辑器状态、字体确认和模板状态全部走 i18n；模板不渲染空列表 section | 数据文件与样式配置继续分离 |
| R23 | 照片卡片在单行 flex 中同时放置缩略图、长文件名与操作按钮，min-content 宽度会撑破左栏 | 照片卡片使用固定缩略图列与 `minmax(0,1fr)` 内容列；文件名截断，操作区在内容列内换行，卡片禁止横向溢出 | 所有上传文件名均按超长无断点文本验收 |
| R24 | 预览栏固定显示 `100%` 但没有缩放语义；直接 `transform: scale()` 又不会扩大滚动布局 | 使用独立 Zustand 视图状态控制 50%-200% 的实际预览容器尺寸；按钮/预设比例、Ctrl/Cmd+滚轮及触摸板捏合共用同一状态；放大后提供双向滚动且不重新编译 Typst | 仅已有预览产物时允许缩放；预览区域内手势阻止浏览器页面级缩放，普通滚轮仍滚动预览 |
| R25 | GitHub 托管 runner 会淘汰旧 Action 运行时，`init` 生成的 workflow 与仓库 CI 可能因长期未更新而失效 | 官方 Actions 使用已核对的最新稳定主版本：`checkout@v6`、`setup-node@v6`、`cache@v5`、`upload-artifact@v7`、`configure-pages@v5`、`upload-pages-artifact@v4`、`deploy-pages@v4`；`setup-bun@v2` 保持当前主版本 | 升级 Action 主版本时同步生成器、文档、fixture 与仓库 workflows；第三方 Semifold setup 继续跟踪其 `main` |
| R26 | `init` workflow 把单个 `resume.pdf` 压缩为名为 `resume` 的 artifact，且每次 runner 都重复下载模板字体 | `upload-artifact@v7` 使用 `archive: false` 直接以 `resume.pdf` 文件名上传；`cache@v5` 缓存 `.typsume/fonts/`，主键包含 OS、项目配置和 source 哈希，OS restore key 复用既有字体并允许配置变化后保存增量 | 直传只允许单文件；未来输出多文件时必须恢复归档模式或拆分 artifact |

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
