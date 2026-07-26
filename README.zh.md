# Typsume

数据驱动 Typst 简历编译器。JSON / YAML / TOML → PDF，全流程 WASM 编译，无需安装 Typst。

## 快速开始

```bash
bun install

# 构建示例简历
bun run typsume build examples/sample/resume.json

# 新建项目
bun run typsume init my-resume
cd my-resume
bun run typsume build resume.json
```

## 结构

```
@typsume/workspace         根工作区
├── packages/
│   ├── core               共享 Zod schema + TS 类型 + JSON Schema
│   └── cli                typsume CLI（citty + typst.ts WASM）
├── templates/
│   └── default/           默认双栏简历模板
├── examples/
│   └── sample/            示例占位数据
└── .changes/              smif 变更集
```

## CLI

| 命令 | 功能 |
|------|------|
| `typsume build <source>` | 校验并编译为 PDF |
| `typsume validate <source>` | 仅校验 schema |
| `typsume dump <source>` | 标准化并输出 JSON |
| `typsume templates` | 列出可用模板 |
| `typsume init [dir]` | 初始化最小项目 |
| `typsume dev <source>` | 监听文件变更自动重建 |

输入支持 JSON、YAML、TOML。

## 许可证

MIT
