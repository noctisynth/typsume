# Web App Design (packages/web)

> 浏览器端简历编辑器。面向所有用户（不写代码）。
> 通过表单收集 → JSON → typst.ts WASM 编译 → 流式 SVG / PDF 下载。
> 不依赖后端；可静态托管。
> 数据契约见 [`docs/data-driven-template.md`](./data-driven-template.md)，产品定位见 [`docs/PRD.md`](./PRD.md)。

---

## 1. 目标与定位

- **用户**：不会 Typst 也不愿写 YAML/JSON 的求职者；HR/猎头；想做 A/B 简历试排版的求职者
- **核心价值**：零安装、零登录、隐私（数据不上传任何服务器）
- **不做**：账号体系、云同步、协作编辑（v1.x 之前都不做）

W4 交付一份当前简历的完整编辑闭环：表单、浏览器内编译、预览、PDF 导出和 IndexedDB
草稿恢复。多简历/多版本管理、第二套模板、分享链接和 Playwright e2e 属于 W5，不提前混入
W4 的数据模型。

## 2. 技术栈

| 维度 | 选型 | 理由 |
|------|------|------|
| 框架 | React 19 + TypeScript | shadcn/ui 默认依赖 React，生态最稳 |
| 构建 | Vite | 默认值；后续可考虑 Farm（dogfood） |
| UI | shadcn/ui + TailwindCSS | React 版生态最完整 |
| 状态 | Zustand + `zustand/middleware/persist` (IndexedDB) | 比 Redux 轻，与 shadcn 配套 |
| 表单 | React Hook Form + `@hookform/resolvers/zod` + Zod | 与 `packages/core` 的 schema 共享 Zod 实例 |
| 代码编辑器（高级模式） | CodeMirror 6 + YAML lang | 轻量、易接 schema 校验 |
| 编译 | `@myriaddreamin/typst.ts` compiler + renderer WASM | 浏览器内编译零后端 |
| 路由 | React Router DOM 7 | 标准 |
| 国际化 | react-i18next + i18next | 至少 zh-CN / en-US |
| 测试 | Vitest（单测）+ Playwright（e2e） | 复用 monorepo |

### 2.1 工程约定

- 所有文件名使用 kebab-case（React 组件导出仍使用 PascalCase）。
- 样式使用 TailwindCSS utilities；除 `src/index.css` 中的 Tailwind/shadcn theme token 与全局
  基线外，不维护手写业务 class stylesheet。
- UI 元组件必须通过 shadcn CLI 增加，生成到 `src/components/ui/`；不得手写另一套按钮、
  输入框、卡片等基础组件。
- 所有 React 组件放在 `src/components/`：shadcn 元组件位于 `components/ui/`，业务组件按
  `components/<feature-name>/` 分组。
- 所有 Zustand 模型放在 `src/models/`；组件目录不得夹带 store/model。

## 3. 模块划分

```
packages/web/src/
├── app/                    # 入口、路由、全局 Provider
│   └── router.tsx          # 路由表
├── components/
│   ├── ui/                 # shadcn CLI 生成的元组件
│   ├── home/               # 首页页面组件
│   ├── resume-editor/      # 编辑器页面、布局、TopBar、Outline
│   ├── resume-form/        # 基于 schema + react-hook-form + zod
│   ├── resume-preview/     # Typst renderer 适配层、编译状态、PDF 导出
│   └── template-picker/    # 模板切换 UI
├── models/
│   ├── resume-model.ts     # 当前草稿 + IndexedDB persist
│   └── preview-model.ts    # 浏览器编译与预览状态
├── lib/                    # 非组件工具（shadcn cn、资源加载等）
└── main.tsx
```

原则：包括页面组件在内的所有 React 组件都按 `components/<feature-name>/` 切分，状态统一进入
`models/`，非 React 工具进入 `lib/`。不得重新引入 `pages/`、`features/` 或 `shared/ui/`
目录。

## 4. 三栏编辑器布局

```
┌────────────────────────────────────────────────────────────┐
│  TopBar  [Resume Name]   [Template ▾]   [Export ▾]   [⋯]   │
├──────────────┬──────────────────────────┬──────────────────┤
│              │                          │                  │
│   Form       │       Preview            │   Outlines       │
│              │   (typst.ts render SVG)  │                  │
│              │                          │                  │
│   - Basics   │                          │   1  教育         │
│   - Skills   │                          │   2  实习         │
│   - Projects │                          │   3  项目         │
│   - …        │                          │                  │
│              │                          │                  │
├──────────────┴──────────────────────────┴──────────────────┤
│   Status bar:  Edits · Last compiled 17:32:04 · Latency 80ms│
└────────────────────────────────────────────────────────────┘
```

- 左侧：表单，按 `ResumeData` 字段分组
- 中间：实时预览（WASM 编译）
- 右侧：结构跳转（点击跳到对应 section 表单 + 预览位置）

结构跳转只能滚动左侧 Radix ScrollArea viewport，不得调用可能连带滚动 document root 的
`scrollIntoView()`；重复点击不能改变页面根滚动位置或编辑器整体布局。

移动端 v1 不做。

## 5. 关键数据流

```
                    ┌──────────────┐
                    │ React Hook   │
                    │     Form     │
                    └──────┬───────┘
                           │ commit（防抖 300ms）
                           ▼
                    ┌──────────────┐
                    │  Zustand     │  ┐
                    │  Store       │  │ Zod schema 校验
                    └──────┬───────┘  │ + 缺字段提示
                           │          ┘
                           ▼
                    ┌──────────────┐
                    │  typst.ts    │   WASM 编译（增量）
                    │  compiler    │
                    └──────┬───────┘
                           │
              ┌────────────┼─────────────┐
              ▼            ▼             ▼
        SVG (render)  PDF (download)  IndexedDB (persist)
```

### 5.1 增量编译

typst.ts 支持 **incremental rendering**。不是每次都重新编译整个文档：

- 表单字段值变化：仅重渲受影响页
- 模板切换：全量重编译
- 网络字体加载：增量传输

模板远程字体遵循 [`docs/data-driven-template.md`](./data-driven-template.md) 的统一资源契约：浏览器
按镜像顺序下载，在内存中完成可选完整性校验与 ZIP 解压，再把字体字节交给 typst.ts。Web 字体
不写入 IndexedDB、Cache Storage 或 Service Worker；同一页面生命周期可以复用，刷新后重新下载。
CLI 的项目内 `.typsume/fonts/` 缓存不改变 Web 的零持久字体缓存策略。

浏览器端同样不得静默降级：镜像切换、校验失败、解压失败、无有效字体以及最终继续编译的行为都要
显示在编辑器状态区，并说明接下来可能使用不同字体或编译失败。远程资源全部失败后，在支持桌面
Local Font Access API 的浏览器中调用 `queryLocalFonts()`；浏览器权限提示不可绕过。先匹配模板声明
的字体 family，再依次尝试 `Maple Mono NF CN`、`Maple Mono CN`、`PingFang SC`、
`Microsoft YaHei`、`Noto Sans CJK SC` 与 `Source Han Sans SC`。候选匹配使用浏览器展示 family，
但注入 Typst 配置前必须把实际字体字节交给 typst.ts font builder，使用字体文件内部 family；不得假设
Local Font Access 的展示名称与 Typst 识别名称相同。API 不可用、用户拒绝、字体无法解析或无候选时
继续无模板字体编译并显示警告。

W4 同时提供字体上传与选择：接受完整的 TTF / OTF / TTC 文件，使用 typst.ts 自身解析、校验字体并
列出内部 family；用户可选择“模板默认”或已上传 family。选中的上传字体覆盖模板默认字体配置，
但不修改 `meta.toml`；`meta.toml` 只是模板默认值，不是用户字体锁。上传字节、解析结果和选择只保留
在当前页面生命周期，不进入简历 schema、IndexedDB、Cache Storage 或 Service Worker。无须引入字体
解析器或专用 React font picker：选择 UI 复用 shadcn 元组件，解析能力复用编译栈。

`@chinese-fonts/maple-mono-cn` 是供浏览器 CSS 使用的 `unicode-range` WOFF2 分片集合；其
`dist/MapleMono-CN-Regular/result.css` 可以直接由 CDN 引入，但任一哈希 WOFF2 都不是完整字体，
Typst 也不会按 CSS 规则组合这些分片，因此不得把它作为模板远程字体资源。

字体目录调研结论：Fontsource API 与 Google Fonts Developer API 可用于未来的字体搜索元数据，现有
React font picker 也主要是 Google Fonts 目录的 UI 封装；它们不能保证返回可直接交给 Typst 的完整
字体资源。W4 不接入 CDN 目录。后续接入前必须补齐完整文件定位、字体内部 family 校验、许可证展示、
跨域与缓存策略。

浏览器不能读取 `basics.photo` 中的任意本地路径。空字符串提交时归一化为未设置；非空路径在 Web
预览中显示资源警告并从本次浏览器编译数据中移除，避免 WASM 越过虚拟工程根。该处理不修改用户草稿，
CLI 仍按模板资源契约解析路径。图片上传与虚拟工程挂载另行实现。

第一次加载 typst.ts WASM 体积较大（~5MB 量级），W4 需做：

- 进入编辑器页再按需加载（首页只渲染首页）
- React 端用 `React.lazy + Suspense` 包裹编辑器页 chunk
- Vite 将编译器和渲染器拆入独立异步 chunk；静态宿主的 gzip/brotli 由部署层配置

### 5.2 PDF 导出

WASM 端可直接生成 PDF（typst.ts 提供）。下载触发：

```ts
const blob = await renderer.pdf({ artifact });  // Uint8Array
saveAs(blob, `${resumeName}.pdf`);
```

若浏览器兼容性差，回退方案：先下载 SVG，前端用 `pdf-lib` 二次嵌入。但 typst.ts 的 PDF 输出应优先验证。

### 5.3 React 集成

React 侧使用项目内的 `<TypstPreviewDocument />` 适配组件调用 `@myriaddreamin/typst.ts`
renderer：

```tsx
<TypstPreviewDocument fill="#343541" artifact={artifact} />
```

renderer WASM 实例不是可重入对象，且 `renderToSvg()` 会在 Rust 借用 renderer/session 期间直接操作
浏览器 DOM，可能因 DOM 回调或 StrictMode effect 重放触发 wasm-bindgen 所有权 panic。适配层必须通过
单一 Promise 队列串行调用 `renderSvg()`：每个任务使用独立 artifact 字节副本，只让 WASM 返回 SVG
字符串；Rust 调用和 session 释放完成后，React 侧再把字符串解析到 detached staging container，
effect 仍有效时才替换当前预览。任何 renderer 调用失败后必须丢弃该实例，下一任务重新初始化。
不得通过关闭 StrictMode 掩盖 renderer 生命周期问题。

简历预览是静态 SVG，只请求 renderer 的 body、defs 与 CSS，不携带 renderer JavaScript，避免无关的
运行时脚本、控制台日志和主线程 message handler。compiler、font builder 与 renderer 的 WASM
初始化统一使用 wasm-bindgen 的 `{ module_or_path }` 单对象参数，项目控制范围内不得产生弃用警告。
Vite 连接、React DevTools 提示和浏览器扩展日志不属于生产应用告警；Chrome `[Violation]` 是性能诊断，
必须以 production profile 判断，不能通过拦截 `console` 隐藏。

左侧多选 Accordion 的用户点击直接决定展开集合；点击已展开 section 必须一次收起。右侧结构导航通过
独立的 section 选择状态请求定位与展开。Accordion trigger 不得先写入选择状态再由 effect 强制回填，
否则首次收起会被撤销。

artifact 是 `typst.ts` 编译器产出的二进制包，由 Zustand store 派生：

```tsx
const artifact = useResumeStore(s => s.compileArtifact());   // 派生 selector
useEffect(() => { void loadArtifact() }, [resumeData, template]);
```

避免每帧全量 re-render：用 `useSyncExternalStore` 订阅 artifact 变化。

### 5.4 持久化

- W4 在 IndexedDB 存当前 `ResumeData` 草稿（通过 `zustand/middleware/persist` 自定义 storage）
- 自动保存：表单 commit 后 1s 防抖落盘
- W5 再把存储模型升级为多简历/多版本，并加入分享链接；W4 不写入 `localStorage`

## 6. 模板切换

- W4 内置模板只有 `templates/default/`
- 在构建阶段把默认模板的 `template.typ` + `meta.toml` + 图标作为静态资源打包
- 切换模板：reload typst 编译器参数，使用新模板根目录
- 第二套内置模板在 W5 加入；W4 的选择器保留扩展接口，但不得展示不存在的模板
- 自定义模板（v1.1）：用户上传 zip，IndexedDB 存 base64；预算风险较大，先不做

## 7. 表单 Schema 派生

输入：`packages/core` 的 Zod schema  
派生：
- 表单 UI（用 `zodResolver(schema)` 喂给 React Hook Form）
- 校验规则
- 默认值
- 帮助文本

Zod schema 是**单一真相**，下面三处共用：

1. CLI 校验（直接 `ResumeSchema.parse(json)`）
2. Web 表单 UI（`zodResolver(ResumeSchema)`）
3. Web YAML 视图（再 lint JSON Schema）

> 注意：Zod → JSON Schema 转换使用 Zod 4 内置 `z.toJSONSchema()`；不得再引入与 Zod 4
> 不兼容的 `zod-to-json-schema`。派生 schema 由 `packages/core` 统一导出并在 CI 校验。

## 8. 高级模式：YAML 视图

- 表单和 YAML 视图**实时双向绑定**（v1.x，可选）
- v1 只做表单，预留入口
- YAML 视图给"会写"的用户做快速批量编辑；写完 commit 等同表单 submit

## 9. 国际化

- react-i18next + i18next，初始 zh-CN、en-US
- 表单 label、按钮、错误信息走 i18n key
- 简历内容（basics.name 等）不被 i18n 干涉——它们是数据，不是 UI 文案
- `meta.locale` 在提交时传给 typst 模板，影响排版（如西文断字策略）
- shadcn/ui 内置组件文本（即默认 aria-label 等）需要本地化覆盖时走 i18n

## 10. 性能预算

| 指标 | 目标 |
|------|------|
| 首屏 JS（不含 WASM） | < 200KB gzip |
| WASM 加载 | < 1.5s（4G） |
| 编辑→预览 | < 300ms（85 percentile） |
| 编辑→PDF 下载 | < 2s |
| 移动端 | 不支持 v1 |

## 11. 部署

- **首选**：Cloudflare Pages / Vercel 静态部署
- 自定义域名（typst-resume.com / 类似）方便后续做 SEO
- WASM + 字体子集放 CDN
- 不需要 Backend / DB

## 12. 验证清单（DoD）

- [ ] 首屏不加载 WASM，进入编辑器后按需加载（`React.lazy + Suspense`）
- [ ] 表单提交 → 实时预览；典型简历（10 个项目）首编译 < 1s
- [ ] 默认模板通过可扩展的模板注册表加载；W5 加入第二套模板后切换无需刷新页面
- [ ] PDF 输出与 CLI 同 fixture 的 PDF 在像素级不可区分（同一份数据）
- [ ] 关闭浏览器再打开，当前简历草稿与编辑状态恢复
- [ ] React DevTools 中预览组件不引起表单 re-render
- [ ] Vitest 覆盖存储、数据更新和编译资源异常路径
- [x] 用户上传完整字体后可按字体内部 family 选择，预览与 PDF 导出使用同一页面生命周期字体
- [x] 本地字体 fallback 以 typst.ts 解析出的内部 family 注入，不产生 unknown font family
- [x] 重复点击结构导航只滚动左侧表单，不移动页面根；浏览器不可访问的照片路径可见告警并安全降级
- [x] SVG 预览不在 Rust 借用期间直接操作 DOM；renderer panic 后重建实例且 StrictMode 重放安全
- [x] WASM 初始化无项目侧弃用警告；静态 SVG 不携带 renderer JavaScript
- [x] 左侧 section 首次点击即可收起，右侧结构导航仍会展开并定位目标 section
- [ ] W5：多简历/多版本、第二套模板、分享链接与 lhci + Playwright e2e 通过 CI
