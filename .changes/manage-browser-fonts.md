---
"@typsume/web": patch:feat
---

Add browser font management and contain editor navigation

Allow users to upload complete TTF, OTF, and TTC files, select Typst-recognized internal font
families, and use the same page-lifetime font for previews and PDF exports. Validate remote and
local fallback family names through Typst, omit inaccessible browser photo paths with a visible
warning, and keep outline navigation inside the resume form viewport.
