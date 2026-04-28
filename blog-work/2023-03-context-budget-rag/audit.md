---
article: src/content/blog/2023-03-context-budget-rag.md
status: revised-english-final
---

# Audit

Core claim: The hard part of RAG is not retrieving related text, but allocating context budget to evidence that is applicable, current, sourceable, and safe to use.

Evidence table:

| Source | Claim supported | Confidence | Limitation |
| --- | --- | --- | --- |
| https://arxiv.org/abs/2005.11401 | Retrieval-augmented generation combines parametric generation with retrieved non-parametric memory. | High | The paper predates many production RAG practices discussed here. |
| https://arxiv.org/abs/2307.03172 | Long-context models may underuse information depending on position. | High | The budget taxonomy is an engineering synthesis. |
| Local draft history | The original short post framed chunking, reranking, metadata, and context budget. | High | The original lacked a decomposed evaluation and refusal model. |

Unverified or inference claims: The budget taxonomy, lifecycle governance, refusal metrics, and metadata operating model are proposed engineering patterns.

Model-voice patterns removed: Generic "large windows do not solve RAG" language was replaced with failure mechanisms around half-facts, applicability, state summaries, document lifecycle, and refusal.

Questions for the author: Should this later include a diagram of the RAG path? Should framework-specific examples be added, or should the post remain tool-agnostic?
