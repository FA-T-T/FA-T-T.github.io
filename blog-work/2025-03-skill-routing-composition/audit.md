---
article: src/content/blog/2025-03-skill-routing-composition.md
status: revised-english-final
---

# Audit

Core claim: Once many skills exist, the main system problem becomes scheduling: candidate scoring, execution graphs, state envelopes, override lifetimes, conflict rules, replay, budget allocation, and user-challengeable explanations.

Evidence table:

| Source | Claim supported | Confidence | Limitation |
| --- | --- | --- | --- |
| https://claude.com/blog/skills | Anthropic describes skills as composable, portable, efficient task capabilities. | High | Product source supports composability, not the full routing design proposed here. |
| https://modelcontextprotocol.io/specification/2025-06-18 | MCP includes protocol features related to tools, prompts, resources, progress, errors, and logging. | High | The state-envelope and replay designs are engineering proposals. |
| Local draft history | The original post focused on routing, overrides, chaining, and conflict resolution. | High | It did not include capability graphs, replay, or user-challengeable explanations. |

Unverified or inference claims: Capability graphs, priority taxonomy, route replay, and public/internal explanation split are proposed architecture patterns.

Model-voice patterns removed: The tool-box analogy was replaced by concrete scheduling failure modes and runtime objects.

Questions for the author: Should "state envelope" become a standard term across your skills? Should a Mermaid graph be added in a future visual revision?
