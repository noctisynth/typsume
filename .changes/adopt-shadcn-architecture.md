---
"@typsume/web": patch:refactor
---

Adopt the shadcn-react project architecture

Use kebab-case files, generate UI primitives with the shadcn CLI, keep all React components under
feature-oriented component directories, move state models to a dedicated models layer, and replace
hand-written component CSS with Tailwind utilities.
