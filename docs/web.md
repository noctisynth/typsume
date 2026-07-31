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

## 2. 技术栈

| 维度 | 选型 | 理由 |
|------|------|------|
| 框架 | React 19 + TypeScript | shadcn/ui 默认依赖 React，生态最稳 |
| 构建 | Vite | 默认值；后续可考虑 Farm（dogfood） |
| UI | shadcn/ui + TailwindCSS | React 版生态最完整 |
| 状态 | Zustand + `zustand/middleware/persist` (IndexedDB) | 比 Redux 轻，与 shadcn 配套 |
| 表单 | React Hook Form + `@hookform/resolvers/zod` + Zod | 与 `packages/core` 的 schema 共享 Zod 实例 |
| 代码编辑器（高级模式） | CodeMirror 6 + YAML lang | 轻量、易接 schema 校验 |
| 编译 | `@myriaddreamin/typst.react` + `@myriaddreamin/typst.ts` WASM | 浏览器内编译零后端 |
| 路由 | React Router DOM 7 | 标准 |
| 国际化 | react-i18next + i18next | 至少 zh-CN / en-US |
| 测试 | Vitest（单测）+ Playwright（e2e） | 复用 monorepo |

## 3. 模块划分

```
packages/web/src/
├── app/                    # 入口、路由、全局 Provider
│   └── router.tsx          # 路由表
├── pages/                  # 页面级组件
│   ├── HomePage.tsx        # 创建/打开/导入 简历
│   ├── EditorPage.tsx      # 三栏布局：表单 / 预览 / 配置
│   └── SettingsPage.tsx    # 全局偏好
├── features/               # 业务功能（每功能独立 slice）
│   ├── resume-form/        # 表单系统，基于 schema + react-hook-form + zod
│   ├── resume-preview/     # 嵌 typst.react 预览组件
│   ├── resume-storage/     # IndexedDB 多简历管理（zustand persist）
│   └── template-picker/    # 模板切换 UI
├── shared/
│   ├── schema/             # re-export from core（typed 二次封装）
│   ├── ui/                 # shadcn/ui 组件（Radix 包装）
│   └── hooks/              # useResume / useTemplate / usePreview
└── main.tsx
```

原则：业务按 `features/` 切分，跨 feature 共享只在 `shared/`。

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
按镜像顺序下载，在内存中完成可选完整性校验与 ZIP 解压，再把字体字节交给 typst.ts。字体不写入
IndexedDB、Cache Storage 或 Service Worker；同一页面生命周期可以复用，刷新后重新下载。

浏览器端同样不得静默降级：镜像切换、校验失败、解压失败、无有效字体以及最终继续编译的行为都要
显示在编辑器状态区，并说明接下来可能使用不同字体或编译失败。当前阶段不调用
`queryLocalFonts()`；系统字体发现与权限交互属于后续任务。

第一次加载 typst.ts WASM 体积较大（~5MB 量级），需做：

- `vite-plugin-compression` 预压缩（gzip/brotli）
- 拆 `node_modules/@myriaddreamin/typst.ts/dist/` 中字体子集
- 进入编辑器页再按需加载（首页只渲染首页）
- React 端用 `React.lazy + Suspense` 包裹编辑器页 chunk

### 5.2 PDF 导出

### 5.2 PDF 导出

WASM 端可直接生成 PDF（typst.ts 提供）。下载触发：

```ts
const blob = await renderer.pdf({ artifact });  // Uint8Array
saveAs(blob, `${resumeName}.pdf`);
```

若浏览器兼容性差，回退方案：先下载 SVG，前端用 `pdf-lib` 二次嵌入。但 typst.ts 的 PDF 输出应优先验证。

### 5.3 React 集成

用 `@myriaddreamin/typst.react` 暴露的 `<TypstDocument />` 组件：

```tsx
<TypstDocument fill="#343541" artifact={artifact} className="preview-pane" />
```

artifact 是 `typst.ts` 编译器产出的二进制包，由 Zustand store 派生：

```tsx
const artifact = useResumeStore(s => s.compileArtifact());   // 派生 selector
useEffect(() => { void loadArtifact() }, [resumeData, template]);
```

避免每帧全量 re-render：用 `useSyncExternalStore` 订阅 artifact 变化。

### 5.4 持久化

- IndexedDB 存 `ResumeData[]`（通过 `zustand/middleware/persist` 自定义 storage）
- 自动保存：表单 commit 后 1s 防抖落盘
- 导出：`localStorage` 标记最近编辑；`Share Link` 用 URL hash 编码（lz-string 压缩 + base64），不依赖服务器

## 6. 模板切换

- 内置模板：`templates/default/`、`templates/modern/`
- 在构建阶段把这两个模板的 `template.typ` + `meta.toml` + `preview.png` 作为静态资源打包
- 切换模板：reload typst 编译器参数，使用新模板根目录
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

> 注意：Zod → JSON Schema 转换用 `zod-to-json-schema`。两份 schema 同步在构建时校验。

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
- [ ] 切模板无需刷新页面
- [ ] PDF 输出与 CLI 同 fixture 的 PDF 在像素级不可区分（同一份数据）
- [ ] 关闭浏览器再打开，简历列表 + 当前编辑状态恢复
- [ ] React DevTools 中预览组件不引起表单 re-render
- [ ] lhci + Playwright e2e 通过 CI
