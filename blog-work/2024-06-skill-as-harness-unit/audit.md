---
article: src/content/blog/2024-06-skill-as-harness-unit.md
status: revised-english-final
---

# Audit

Core claim: A skill is useful when it becomes a maintainable task package: activation rules, instructions, references, scripts, assets, outputs, tests, failure paths, and ownership under version control.

Evidence table:

| Source | Claim supported | Confidence | Limitation |
| --- | --- | --- | --- |
| https://claude.com/docs/skills/overview | Claude Skills are task-specific packages with instructions, scripts, and resources. | High | Source is later than the article date; it supports the pattern, not the exact 2024 timeline. |
| https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices | Skill authoring guidance supports descriptions, progressive disclosure, scripts, and testing practices. | High | Vendor-specific details should not be overgeneralized. |
| https://modelcontextprotocol.io/specification/2025-06-18 | MCP provides adjacent protocol boundaries for tools, prompts, and resources. | High | MCP is not itself a skill packaging standard. |

Unverified or inference claims: "Skill as harness unit" is the article's abstraction. The article avoids claiming a single universal standard existed in June 2024.

Model-voice patterns removed: The earlier recipe-style explanation was replaced with boundaries around trigger rules, scripts, references, assets, smoke tests, rot, and bad-skill smells.

Questions for the author: Should the article explicitly say "skill" is used as an engineering abstraction? Should the YAML example later align to one concrete platform?
