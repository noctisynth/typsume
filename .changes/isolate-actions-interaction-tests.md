---
"@typsume/cli": patch:chore
---

Isolate interaction tests from CI authorization

Tests for declined and non-interactive font downloads now use an explicit environment so the
GitHub Actions authorization variable cannot change their expected policy branch.
