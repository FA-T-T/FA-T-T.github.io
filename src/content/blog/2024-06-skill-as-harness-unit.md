---
title: "Part 4 | Skill as a Harness Unit: Definition, Structure, and a Minimal YAML Example"
description: 'The value of a skill is not the name. It is the boundary that packages prompts, tools, evidence, scripts, assets, outputs, and failures into a versioned execution asset.'
deck: 'Prompt templates help with one call. Tool schemas help with external actions. Long-term maintenance needs a larger unit that makes a repeated task portable, testable, and owned.'
date: 2024-06-18
tags:
  - harness
  - skills
  - yaml
use_math: false
draft: false
---

Once prompts, RAG, and function calling enter the same system, a new problem appears. The pieces are scattered. Prompts live in a shared document. Retrieval settings live on a service. Tool schemas live in a repository. Evaluation samples live in a spreadsheet. A helper script sits on one engineer's laptop. The workflow looks intelligent when the person who assembled it is present. It becomes fragile when the workflow must be moved, audited, repeated, or handed to someone else.

I call the missing boundary a skill. The word is less important than the boundary. A skill is not a prompt, not a tool, and not a workflow engine. It is the smallest maintainable unit for a class of tasks. A good skill says when it should be invoked, what instructions apply, which references may be read, which scripts may run, which tools may be called, what output must look like, and how failure should be reported. It moves "knowing how to do this" out of a person's head and into files under version control.

Public product shapes have moved in the same direction. Claude's [Skills overview](https://claude.com/docs/skills/overview) describes skills as directories containing instructions, scripts, and resources that are loaded dynamically for specific tasks. Anthropic's launch post describes skills as composable, portable, efficient packages of instructions, code, and resources. The [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-06-18) standardizes another side of the problem: connecting model applications to external context and tools. These are not the same abstraction. Together they show the same pressure. A single prompt is too small for durable work.

## The Missing Boundary Is Maintenance

A prompt template can be useful. It can constrain output, define examples, and reduce drift. But it usually covers only model input. When the task also needs evidence, scripts, file formats, error recovery, style rules, and quality checks, the template swells. Either it becomes a giant prompt, or it hides critical steps in external convention. The first wastes context. The second cannot be reproduced.

A skill is not a longer prompt. It is a way to put task knowledge into the right medium. Stable execution rules belong in `SKILL.md`. Long reference material belongs in `references/`, loaded only when needed. Deterministic operations belong in `scripts/`, where code can parse tables, render documents, count fields, or run checks instead of asking the model to improvise. Templates, sample files, images, and brand assets belong in `assets/`. The model no longer needs to ingest the whole task universe at once. The runtime can see what each file is responsible for.

This is ordinary software engineering. We do not put all business logic into one giant function. We should not put all task knowledge into one giant prompt. Software needs module boundaries. AI harnesses need them too.

## A Skill Must First Answer When It Applies

Many skill designs fail because they explain how to act but not when to act. If activation is vague, routing becomes unstable. A code-review skill described as "helps improve code quality" can match almost any programming task. A stronger description says it should be used when the user asks for review, PR inspection, bug risk, or regression analysis; it should not be used when the user simply asks to implement a new feature, unless review is part of the request.

The activation description is the entrance contract. It decides whether the runtime loads the package. Too broad, and it pollutes unrelated work. Too narrow, and the system fails to use it. Negative conditions matter because they reduce false positives. "Use for existing Markdown articles that need revision or audit, not for casual title brainstorming" is more useful than "helps with writing."

A minimal platform-neutral shape could look like this:

```yaml
name: wiki-quick-view
version: 1.0.0
description: >
  Summarize a Wikipedia-like topic from retrieved evidence.
  Use only when the user asks for a sourced quick overview.
  Do not use for legal, medical, or current-news questions.

instructions:
  system: |
    Answer only from retrieved snippets.
    If snippets conflict, name the conflict instead of choosing silently.
  task: |
    Produce a short overview with citations and open questions.

tools:
  - name: search_wikipedia
    input_schema:
      type: object
      properties:
        query: { type: string }
        top_k: { type: integer, minimum: 1, maximum: 5 }
      required: [query]

context:
  retrieval:
    tool: search_wikipedia
    query_template: "{user_query}"
    top_k: 3
    fields: [title, snippet, url, retrieved_at]

output:
  type: object
  required: [summary, citations, open_questions]
  properties:
    summary:
      type: array
      items:
        type: object
        required: [topic, paragraph, citation_ids]
    citations:
      type: array
      items:
        type: object
        required: [id, url, retrieved_at]
    open_questions:
      type: array
      items: { type: string }
```

This is not a proposed universal standard. It shows the responsibilities that need to travel together. Activation defines the use case. Instructions constrain model behavior. Tools constrain actions. Context rules define evidence injection. Output defines what another system can parse. Remove any of those, and the skill becomes documentation rather than an execution asset.

## Scripts Are Where Determinism Should Land

AI systems often ask the model to do things code should do. Count rows. Parse CSV. Validate frontmatter. Render a PDF. Check whether a Markdown file has required fields. Compress images. The model can describe those operations, but the execution should be deterministic.

The `scripts/` directory is the landing zone. A script should do one clear job, take explicit inputs, return explicit outputs, and fail with readable errors. A quality gate checks frontmatter, length, forbidden phrases, and evidence density. A rendering script exports a document to images. A data script reads CSV and returns statistics. The model reads the result and makes judgment; it does not need to invent the calculation.

This changes the division of labor. Models are good at interpretation, synthesis, tradeoff, and fuzzy constraints. Scripts are good at exact parsing, conversion, counting, and repeatable validation. A skill bundles the two so that deterministic work does not become model theater, and scripts do not become orphaned tools nobody knows when to call.

## References Protect Context Hygiene

Reference material can be large: brand guides, legal rules, database schemas, API manuals, style guides. Putting all of it into the main prompt overloads the context. Leaving it outside the package makes the runtime guess which file matters.

References give a middle path. The main instruction says when to read which file. The details stay in separate documents. A document-processing skill can read `slides.md` for slide work, `contract-summary.md` for contract summaries, and `voice.md` for blog writing. The main prompt stays short. The model loads only what the task needs.

This is progressive disclosure. Claude's skill documentation explicitly frames skills this way: metadata is light, `SKILL.md` loads when relevant, and additional files are loaded when needed. The principle matters beyond any vendor. Context is a budget. A skill that loads every reference by default becomes a noise source.

## Assets Prevent On-the-Fly Invention

Some tasks need materials, not just rules. Slides need templates. Brand writing needs logos, palettes, and forbidden terms. Image generation needs references. Spreadsheet work needs sample files. Without assets, the model imagines. Imagination can be useful in creative tasks. It is a liability when consistency matters.

Putting assets inside the skill says that the task package contains not only "how to do it" but "what to do it with." New users do not need to ask where the deck template lives. The runtime does not need to search the whole disk. Version control can record asset changes. If output changes because the template changed, the diff can explain it.

This is not exotic. Software packages have fixtures, templates, and static resources. Skills bring the same discipline into model workflows.

## The Main File Should Be Short and Hard

`SKILL.md` easily becomes a dumping ground. The author worries that the model may forget a rule, so every detail goes into the main file: background, examples, edge cases, scripts, style guidance, API notes, and failure handling. The model sees more text and less priority.

The main file should be short and hard. It should name the skill, define activation, describe the workflow, point to references, point to scripts, define outputs, and state safety boundaries. It should work like an onboarding index, not an encyclopedia. Long material belongs one level away, in files that are loaded only when the task requires them.

This is also what makes composition possible. A large, chatty skill cannot be easily loaded beside another skill. A compact skill can cooperate with routing, quality gates, and downstream workflows.

## Quality Gates Are Minimum Self-Respect

A stable skill should have a quality gate. A writing skill checks frontmatter, length, generic phrases, and evidence density. A code skill runs tests and lint. A document skill renders pages and checks layout. An image skill checks size and format. A research skill checks sources and unsupported claims. The gate does not need to be perfect. It needs to catch the common failures that should not reach the user.

Quality gates also force the author to define what "good enough" means. If a workflow has no gate, it still lives in the world of "looks fine." Looks fine cannot be automated. Gates will have false positives. Those should be recorded and improved. The point is to create a checkable surface.

## Examples Should Be Regression Cases

Examples in a skill are not tutorials first. They are boundary definitions. A writing skill should include evidence-thin cases, not just polished success. A spreadsheet skill should include missing columns and empty cells. An image skill should include reference constraints and forbidden elements.

Good examples can become regression tests. Every skill change can run through them. The output does not need to match exactly, but the required properties should hold. This keeps examples from rotting into decorative documentation. Small sharp examples are better than one giant happy-path demo because they tell you what boundary they protect.

## Installation and Discovery Are Design

A skill that cannot be installed, discovered, and smoke-tested is not portable. Directory name, `name`, description, dependency notes, test command, and sample input all belong to the design. The description is especially important because routing systems often read metadata before they read the full skill. A vague description makes the skill hard to select. A broad description makes it trigger too often.

A new environment should be able to run a smoke test: files exist, scripts execute, dependencies are present, output paths are writable. Otherwise the first real task becomes the installation test. When that fails, the user cannot tell whether the skill logic is wrong or the environment is broken.

## Skills Rot

A skill stored as files is not automatically durable. Model behavior changes. APIs change. Dependencies expire. References go stale. User needs drift. A skill that has not been run in six months may still load but produce weaker output, misroute tasks, or ignore new failure modes.

Maintenance should be boring. Run the smoke test. Run representative examples. Check links. Check script dependencies. Read the quality gate. When a failure is fixed, add it to regression cases. A skill is closer to a software package than a document. Treating it as a document is how it rots.

Bad skills have recognizable smells. The description is too broad. The main file is too long. There are no negative activation conditions. Deterministic checks are left to the model. Outputs are unstructured. Audits are absent. Permissions are unclear. Failure paths are not defined. These smells may not break a demo. They break scale.

A mature skill treats failure as an output. If an article cannot be written, produce evidence gaps. If an experiment cannot run, produce an error report. If an image cannot be rendered, produce repair prompts. If publishing is blocked, produce a blocker list. A skill that only produces value on the happy path is still a demo.

## Skill and MCP Are Adjacent, Not the Same

MCP standardizes how model applications connect to tools, resources, and prompts. A skill packages task knowledge. The two fit together, but one does not replace the other. An MCP server can expose file access, search, or database queries. A skill can say how a blog-writing task should use evidence, when to read style guidance, which quality gate to run, and what audit file to produce.

Connection without task strategy leaves the model with many tools and little guidance. Task strategy without connection leaves a nice runbook with no capability. The skill sits between the user goal and the lower-level tools. It presents a task-level ability upward and calls tools, scripts, and references downward.

That is the real value. A skill turns implicit know-how into explicit boundaries. If a process runs once, do not over-package it. If it runs repeatedly, moves between people, needs rollback, or must survive model changes, package it. Not because "skill" is a magic term. Because repeatable work needs a unit that can be owned.
