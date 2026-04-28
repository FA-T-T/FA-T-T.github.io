---
article: src/content/blog/2026-01-skill-guardrails-audit.md
status: revised-english-final
---

# Audit

Core claim: Safety and audit cannot be added only as an outer filter. A skill that reads data, calls tools, writes files, or triggers side effects needs local permissions, guardrails, data-minimization rules, audit logs, retention, and publish gates.

Evidence table:

| Source | Claim supported | Confidence | Limitation |
| --- | --- | --- | --- |
| https://owasp.org/www-project-top-10-for-large-language-model-applications/ | OWASP lists LLM application risks including prompt injection, insecure output handling, sensitive information disclosure, insecure plugin design, and excessive agency. | High | The article maps broad risks to skill-level controls. |
| https://www.nist.gov/itl/ai-risk-management-framework | NIST AI RMF supports lifecycle risk management for AI systems. | High | The article does not attempt a formal NIST control mapping. |
| https://openai.github.io/openai-agents-python/guardrails/ | OpenAI Agents SDK separates input, output, and tool guardrails. | High | SDK behavior may evolve. |
| https://openai.github.io/openai-agents-python/tracing/ | OpenAI Agents SDK documents tracing for agent workflows. | High | The article's config-hash and retention approach is additional design. |
| https://modelcontextprotocol.io/specification/2025-06-18 | MCP includes security and trust considerations around data access, user consent, and tool safety. | High | MCP is protocol-level evidence, not a full skill audit framework. |

Unverified or inference claims: Configuration hashes, audit retention lifecycle, red-team regression cases, and publish gates are proposed mechanisms, not cited benchmark results.

Model-voice patterns removed: The post now grounds "security inside the skill" in concrete guardrail timing, tool boundaries, data minimization, audit privacy, failure classes, and publish gates.

Questions for the author: Should a concrete audit JSON schema be added later? Should the post separate personal-agent and enterprise-agent threat models more sharply?
