---
article: src/content/blog/2022-12-prompt-as-program.md
status: revised-english-final
---

# Audit

Core claim: Prompt engineering in late 2022 was not durable because of magic phrases. Its lasting value was the conversion of open-ended requests into reusable execution contracts with tasks, variables, examples, output shape, checks, and ownership.

Evidence table:

| Source | Claim supported | Confidence | Limitation |
| --- | --- | --- | --- |
| https://arxiv.org/abs/2201.11903 | Chain-of-thought demonstrations can improve complex reasoning tasks. | High | The paper supports CoT prompting, not the broader harness framing. |
| https://arxiv.org/abs/2203.11171 | Self-consistency samples multiple reasoning paths and selects the most consistent answer. | High | The engineering selector interpretation is an inference from the method. |
| Local draft history | The original short post defined the series topic and chronology. | High | The original had no citations or implementation evidence. |

Unverified or inference claims: The ownership, diff, regression, and prompt-as-control-plane framing is engineering synthesis, not a cited empirical claim.

Model-voice patterns removed: The Chinese explainer shape was replaced with concrete maintenance mechanisms: failure examples, regression cases, prompt ownership, diff discipline, and boundary escalation.

Questions for the author: Should the series keep "Part 1" in public titles? Should the prompt-owner section later cite a real team workflow, or stay analytical?
