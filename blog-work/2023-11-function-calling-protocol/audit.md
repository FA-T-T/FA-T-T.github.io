---
article: src/content/blog/2023-11-function-calling-protocol.md
status: revised-english-final
---

# Audit

Core claim: Function calling matters because it turns model output into a typed intermediate representation that can be validated, rejected, executed, retried, confirmed, replayed, and audited.

Evidence table:

| Source | Claim supported | Confidence | Limitation |
| --- | --- | --- | --- |
| https://openai.com/index/function-calling-and-other-api-updates/ | OpenAI introduced function calling as JSON arguments for developer-described functions and discussed risks from untrusted tool output. | High | Product details evolve; the article uses the source historically. |
| https://openai.com/index/introducing-structured-outputs-in-the-api/ | Structured Outputs tightened schema adherence and noted schema constraints around parallel tool calls. | High | Later source used to explain the direction of the protocol. |
| Local draft history | The original post covered schema, runtime, parallel tools, and output protocol. | High | It did not separate idempotency, schema evolution, tool choice, and confirmation. |

Unverified or inference claims: The idempotency, versioning, and observability sections are API-engineering synthesis rather than cited product guarantees.

Model-voice patterns removed: The article now grounds "tool reliability" in schemas, result envelopes, tool trust tags, retry safety, versioning, and confirmation snapshots.

Questions for the author: Should the post include TypeScript or Python examples later? Should OpenAI-specific wording be further generalized for other tool protocols?
