---
title: "Part 5 | Skill Routing and Composition: Scheduling, Overrides, and Conflict Resolution"
description: 'Once skills multiply, the hard problem moves from writing new capabilities to deciding when to use them, how to connect them, and who can override whom.'
deck: 'One skill gives a task a reproducible boundary. Many skills create a scheduling problem. Without routing, state envelopes, and conflict rules, the system becomes implicit global state.'
date: 2025-03-12
tags:
  - skills
  - routing
  - orchestration
use_math: false
draft: false
---

When an AI harness has three skills, routing feels easy. Blog request, load the blog skill. Image request, load the image skill. Spreadsheet request, load the spreadsheet skill. Once the system has dozens, complexity changes shape. One user request can look like writing, research, code, audit, and publishing at the same time. Each skill brings its own instructions, references, tools, output formats, and safety boundaries. Without a routing layer, the system is not more capable. It is more likely to be torn apart by local rules.

Skill composition is not just "choose the closest skill." That is classification, and it is only the first layer. The harder question is execution semantics. Can two skills be loaded at once. Which rule wins. Can one skill's output become another skill's input. How long does a user override live. What happens when a low-risk writing skill wants speed and a high-risk publishing skill wants confirmation. If the runtime cannot answer those questions, skills become global side effects.

The claim here is narrow. Multi-skill systems do not need only a smarter intent classifier. They need a scheduling model: candidate scoring, execution graphs, state envelopes, override scope, conflict rules, replay, and explanations a user can challenge.

## Routing Cannot Be Only Semantic Match

Semantic match is necessary. "Expand this draft into a technical blog" should match a blog-writing skill. "Review this PR for bugs" should match a code-review skill. But semantic match only answers whether the request looks related. It does not answer whether the skill should run.

A usable router looks at several signals. Task intent says what artifact the user wants. Input shape says whether the context contains files, images, tables, code, logs, or links. Risk says whether the skill may write files, call external services, modify a repository, or spend money. Cost says how much context, tool time, and external work the skill needs. History says whether the skill has succeeded on similar tasks. User constraints say whether a skill was requested or forbidden.

Those signals should not collapse into an unexplained score. The router should return candidates, reasons, confidence, and risk. Low-risk tasks may run the top candidate. High-risk tasks may ask for confirmation. Multi-step tasks may convert candidates into an execution graph.

```json
{
  "request_id": "run_2025_03_12_001",
  "candidates": [
    {
      "skill": "tech-geek-blog",
      "score": 0.91,
      "reason": "The user asks to turn Markdown drafts into publishable technical blog posts.",
      "risk": "write_files",
      "requires_confirmation": false
    },
    {
      "skill": "research-lit",
      "score": 0.43,
      "reason": "Public evidence may be needed, but the task is not primarily a literature review.",
      "risk": "network_read",
      "requires_confirmation": false
    }
  ],
  "decision": "compose",
  "plan": ["tech-geek-blog", "research-lit:evidence-only"]
}
```

That object is more cumbersome than "use tech-geek-blog." It is also more debuggable. If an article later contains a factual error, the team can ask whether the router underweighted the evidence stage. If a file was modified unexpectedly, the risk tag can be inspected. Routing output should be part of the audit trail, not a hidden model impression.

## Composition Is Not Prompt Concatenation

When several skills match, the worst move is to paste all their instructions into one context. That appears to preserve capability. In practice it creates instruction conflict and context pollution. One skill wants short conversational prose. Another wants proof-like rigor. One wants public-source verification. Another wants local-only operation. One wants JSON. Another wants Markdown. The model receives more rules and less priority.

Composition needs an execution graph. A "rewrite these blog drafts" task can be split into evidence collection, structure planning, article rewrite, audit, quality check, and site build. The evidence phase can borrow research rules. The writing phase loads voice and structure rules. The quality phase runs a gate. The build phase only needs local commands. Each phase has inputs, outputs, and stop conditions. Not every rule needs to be active at every moment.

This is closer to a Unix pipeline than to one giant prompt. The top-level goal delegates to local controllers. Each controller acts within a time window. Its output enters state. The next phase reads what it needs. That is how composition avoids becoming a bag of instructions.

## State Envelopes Hold the System Together

A single skill can sometimes rely on chat history for state. Multiple skills cannot. Each skill may rewrite the same natural-language summary. After a few phases, nobody knows which fact came from where. State has to be structured, and phase outputs should append rather than overwrite.

Call this structure a state envelope. It does not need to be a database. It can be a runtime object holding artifacts, citations, decisions, errors, warnings, user overrides, and policy checks. Each skill writes only the fields it owns and preserves source. The next skill reads necessary fields instead of reinterpreting the whole conversation.

```json
{
  "artifacts": [
    {
      "id": "draft_1",
      "type": "markdown",
      "path": "src/content/blog/2025-03-skill-routing-composition.md"
    }
  ],
  "decisions": [
    {
      "by": "tech-geek-blog",
      "decision": "Keep existing draft:false because the post was already public.",
      "reason": "Do not unpublish content without an explicit user request."
    }
  ],
  "citations": [
    {
      "id": "mcp_spec",
      "url": "https://modelcontextprotocol.io/specification/2025-06-18",
      "used_for": "protocol boundary for tools and context"
    }
  ],
  "warnings": [
    {
      "source": "quality_gate",
      "message": "Evidence density warning accepted as false positive for English output."
    }
  ]
}
```

The important part is append semantics. A generation phase should not silently delete an evidence warning. A build phase should not rewrite a writing decision. A user override should enter state with scope and lifetime. This gives the system a timeline.

## Overrides Need Scope and Lifetime

Users often give temporary preferences: use only English sources, do not browse, write fast first, keep the original title, run commands only in this directory. These preferences should matter. They should not live forever.

Scope says where the override applies. This turn, this session, this project, this skill, this tool, this output field. "Do not publish this article" should affect the article's publication step, not every future blog. "Use English this time" should affect the current output language, not every future code comment.

Lifetime says when the override expires. The default should be short. Persistent overrides need explicit confirmation because they change future behavior. Many strange AI-tool behaviors come from stale preferences. A user asks for terse answers once, and the system stays terse for days. That is not intelligence. It is an override without expiration.

Overrides also need non-overridable fields. Users can override style. They cannot override safety boundaries. They can request fewer tools. They cannot request hidden audit logs. They can ask to preserve phrasing. They cannot ask to preserve known falsehoods.

## Conflict Resolution Should Be Deterministic

Conflicts are normal. A blog skill wants long-form prose. A site template wants concise frontmatter. A research skill wants public citations. The user says use local files only. A publish skill wants to push. A safety rule wants to inspect the worktree. Two skills propose different titles. The problem is not conflict. The problem is improvising conflict resolution.

Rules should be explicit. System safety beats user preference. Explicit user instruction beats skill defaults. Task-specific skills beat generic skills. Write operations need stricter gates than read operations. Project conventions beat newly imported style advice. Low-confidence inference cannot override high-confidence fact.

With deterministic rules, the model does not need to perform balance theater. It can name the conflict and apply the rule. If a user asks to publish while the worktree contains unrelated changes, stop and explain. If a writing skill defaults to draft mode but the file is already public and the user asks for a final blog, preserve publication state and record the decision. The point is not that every rule is obvious. The point is that the decision can be explained.

## Risk Determines Static Versus Dynamic Routing

Routing debates often split into two camps. One wants fully automatic intelligent routing. The other wants fixed human-written workflows. Both are reacting to real risks. Automatic routing adapts but can be hard to audit. Fixed workflows are stable but slow to extend.

The practical split is risk. Read-only, low-risk, reversible work can route dynamically: summarize, rewrite, search public documents, generate candidate titles. Write operations, payments, permissions, publishing, deletion, external communication, and production changes should use fixed chains or explicit confirmation. The model can suggest. The runtime controls.

This is least privilege applied to skills. Capabilities are not granted uniformly. They are opened when task, risk, and policy justify them. A mature harness is not the one with the most tools always available. It is the one where powerful tools are unavailable by default.

## Capability Graphs Beat Skill Lists

Many systems store skills as a list. Lists show what exists. They do not express relationships. Real tasks need a graph. Nodes are skills, tools, scripts, references, and artifacts. Edges say depends on, consumes, produces, overrides, or conflicts with.

A blog-writing skill consumes Markdown drafts and produces articles plus audits. A research skill produces evidence tables. A publishing skill consumes articles that passed checks and produces commits or PRs. An image skill should not feed publishing directly without review or format checks. A research skill's unverified sources should not become final claims without audit.

The graph prevents illegal chains. It also explains why a skill was not used. It was not merely low-scoring; it lacked required input or produced output the downstream phase could not consume. That explanation helps the user repair the task.

## Budget Scheduling Is Routing

Routing allocates budget as well as capability. Budget includes context, tool calls, network time, compute cost, user patience, and risk. A complex task may have a fast weak path, a slow auditable path, and an expensive complete path. Matching score alone ignores that difference.

Budget should follow user goal and task risk. "Quick pass" justifies a light route. "Ready to publish" requires full gates. Compliance work deserves more evidence and audit. A title edit should not load a research pipeline.

Budget can also upgrade mid-run. Start light. If the quality gate says evidence is weak, allow public-source verification. If the build fails, load site-debugging rules. If the user asks to publish, enter git and PR flow. Choosing the heaviest path first is slow. Choosing the lightest path forever is brittle.

## Replay Is the Router's Debugger

If routing cannot be replayed, it cannot be debugged. The same user request went through the writing skill yesterday and the research skill today. Did the user context change. Did skill descriptions change. Did the model change. Did the threshold change. Asking the model again is not reproduction.

Replay requires input snapshot, available skill list, skill description versions, routing prompt, candidate scores, overrides, runtime policy, and final selection. Replaying the route offline tells you whether later execution failed or the route itself changed. It also allows simulation. Before adding a new skill, run historical requests and see which tasks it steals. Before changing a description, estimate false positives. Without simulation, routing changes become live experiments.

## Users Should Be Able to Challenge Routing

A mature system should survive the question, "Why did you use this skill?" If the answer is "the model decided," routing has not become engineering. A better explanation names trigger conditions, input evidence, and risk rules: this request used the blog skill because the input was Markdown, the user asked for a publishable technical article, and the skill claims that task; it did not use the paper-writing skill because the target was not LaTeX or a venue format.

The explanation does not need to appear every time. It should be available. Users can correct it: "No, I want paper style," or "Do not browse," or "Keep this local." Those corrections become overrides. High-risk skills need explanation even more. A publish skill or remote-write tool should never appear silently.

Explanations also improve skill design. If the router cannot explain why a skill was chosen, the description is probably too broad or the boundary too soft. Weak explanations become feedback for rewriting descriptions, adding negative conditions, or splitting skills.

## More Skills Should Mean Less Loading

The counterintuitive rule is that the more skills a system has, the fewer it should load per task. A hundred available skills does not mean a hundred active skills. The point of routing is to cut context down to what the task needs.

Granularity matters. A "write anything" skill is too broad. A "perform evidence audit for Chinese technical blog drafts" skill may be too narrow unless it is reused often. A useful unit usually corresponds to a deliverable or a stable phase. Skill design should ask not "what else can this do," but "what should this not do."

Routing is not a model problem alone. It is scheduling, state, permissions, testing, and audit. A larger model may understand intent better. It will not automatically invent override lifetimes, replay logs, conflict rules, or publish gates. Those must be designed.

Do not solve every gap by adding another skill. Ask when it triggers, what it consumes, what it produces, what it may override, how it composes, how it is tested, and how it can be rolled back. If the answers are clear, it is an asset. If not, it is another global variable with a nicer name.
