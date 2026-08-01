---
"@typsume/core": patch:feat
"@typsume/cli": patch:feat
"@typsume/web": patch:feat
---

Share template configuration across CLI and Web

Define and validate the complete template configuration contract, apply project overrides from
typsume.config.toml in the CLI, and keep Web typesetting overrides in an independent persisted
model instead of resume metadata.
