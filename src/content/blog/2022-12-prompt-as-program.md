---
title: "Part 1 | Prompt as Program: Few-Shot Templates, Chain-of-Thought, and Structured Instructions"
description: 'Prompt engineering in late 2022 was not spellcraft. Its durable lesson was that natural-language requests can be shaped into reusable, inspectable execution contracts.'
deck: 'The sentence was never the interesting unit. The useful unit was the boundary around the call: task, variables, examples, constraints, checks, and a result the next system could actually use.'
date: 2022-12-15
tags:
  - prompt
  - few-shot
  - harness
use_math: false
draft: false
---

Prompt engineering was easy to misunderstand in late 2022. It looked like a writing trick. One person found a phrase that worked, another person copied it, and a third person wrapped it in a thread about magic words. That was the shallow version of the story. The deeper story was that prompts were becoming interfaces. They turned an open-ended request into a constrained call, with a task boundary, input slots, examples, output shape, and a place to check failure.

Calling a prompt a program does not mean natural language suddenly became Python. It means something narrower. A program earns its place by being reusable, inspectable, and maintainable. A prompt that says "summarize this professionally" has none of those properties. A prompt that names the input, says what evidence is allowed, defines what fields must be returned, and explains when to refuse begins to look like an execution contract. It still runs on a probabilistic model. The boundary around it has changed from conversation to protocol.

That is the part worth keeping from the 2022 prompt wave. Not the exact phrase "think step by step." Not the legend of one perfect template. The important shift was that model behavior could be shaped by external structure. The [Chain-of-Thought Prompting](https://arxiv.org/abs/2201.11903) paper showed that demonstrations containing intermediate reasoning steps could improve performance on arithmetic, commonsense, and symbolic reasoning tasks. [Self-Consistency](https://arxiv.org/abs/2203.11171) showed that sampling multiple reasoning paths and selecting the most consistent answer could beat a single greedy path. The engineering lesson was not that every user should see the entire chain of reasoning. It was that reasoning traces, sampling policy, and selection rules could become part of the calling contract.

## A Spell Cannot Be Maintained

The worst team prompt is not the one that fails. It is the one that works but cannot be explained. Someone pastes a long prompt into a shared document and writes, "This version is stable." Two weeks later the model changes, the input distribution changes, and the output drifts. The next maintainer has no way to know whether the stable part was the role sentence, the examples, the final warning, or a lucky interaction between all of them. That is not an asset. It is folklore.

A maintainable prompt separates responsibilities. The task statement says what should happen. The input slots say where variables enter. The examples show the local mapping from input to output. The output contract says what downstream code can parse. The checks say when the model should stop or downgrade. Once those responsibilities are separated, failures become easier to locate. A classification miss points to task wording or examples. A missing field points to the output contract. Fabricated evidence points to evidence rules or refusal conditions.

The simplest contract is not beautiful:

```text
task:
  Turn the meeting transcript into a decision memo.

input:
  transcript: raw meeting notes
  audience: target reader
  constraints: extra user constraints

rules:
  Only record decisions supported by the transcript.
  If the owner is unclear, write "unspecified" instead of inventing a name.
  Preserve absolute dates from the source.

output:
  decisions: array of decisions
  owners: array of owners
  risks: unresolved risks
  missing: missing information
```

There is no charm in that text. Its value is that every part can be changed and tested. The transcript can change. The audience can change. The rules can be challenged. The output can be read by another program. Prompt engineering starts here. It is not about sounding human. It is about moving the model into a constrained execution space.

## Few-Shot Examples Define a Local Distribution

Few-shot prompting is often described as "giving the model some examples." That description is too weak. The examples define a local distribution inside the context window. If the fields, rhythm, labels, and output shape are consistent, the next input is pulled toward that local pattern. If the examples are inconsistent, the distribution widens and the model starts mixing styles that should have stayed separate.

The first rule of few-shot design is not more examples. It is homogeneity. The input fields should match. The label granularity should match. The output length should match. Failure handling should match. If one example puts uncertainty in `missing` and another hand-waves with "probably Alice," the model learns hesitation, not a task. Many templates fail not because the model does not understand the domain, but because the examples quietly contradict one another.

The second rule is to cover boundaries rather than averages. A template with only successful examples often trains the model to answer when it should stop. Negative examples are usually more valuable. What happens when the owner is missing. What happens when two source lines conflict. What happens when the user asks for something outside the material. These cases are more like engineering assets than polished demos because production failures rarely live on the happy path.

The third rule is budget discipline. Early context windows were small, so every example displaced real input or checks. Larger context windows did not remove the problem. They made it easier to hide bad examples inside a larger prompt. A few high-signal examples are usually better than a pile of weakly related ones. One should show the normal path. One should show missing information. One should show conflict. One should show refusal. The prompt stays shorter, but the boundary becomes sharper.

## Chain-of-Thought Is Not a Monologue for the User

Chain-of-thought was also easy to misread. The research result was that intermediate reasoning demonstrations can help sufficiently large models solve harder tasks. The product mistake was to conclude that all intermediate reasoning should be printed to the user. That creates two problems. The trace can be long and noisy. Worse, a generated trace is not the same thing as evidence. A model can write a coherent explanation for a wrong answer.

A better design separates internal checking from external delivery. The internal layer can ask for assumptions, calculations, evidence mapping, and counterexamples. The external layer should expose only what the user can inspect: conclusion, source, limitation, and next action. This is not hiding thought. It is turning thought into runtime machinery. The user gets a checkable answer. The system keeps enough trace to debug failure.

This already pointed toward harness design. The model should not face the user request naked. It should run inside a control structure that decides when to slow down, when to sample multiple candidates, when to call a tool, and when to refuse. Prompting was the lightest early expression of that control structure.

## Self-Consistency Added a Selector

Self-consistency was not just "ask the model several times." Asking three times and choosing the smoothest answer is still taste. The useful move is to separate generation from selection. Generation allows multiple reasoning paths. Selection evaluates answer convergence, evidence coverage, field completeness, and rule violations.

This looks less like a magic accuracy trick and more like property-based testing. A single output may be accidentally correct. Multiple samples reveal whether the task boundary is stable. If ten samples produce three different owners for the same meeting note, the problem is probably not temperature. The input lacks evidence or the template lacks a rule for owner selection. If the conclusion is stable but the evidence field is missing, the output contract is weak. If every path is fluent but the conclusions conflict, the task may need a tool or a human decision.

Self-consistency made the prompt a tiny workflow. It had a template, samples, an aggregation policy, and a checker. Later agents and workflow runners made the same pattern larger. The principle was already present: do not trust one free-form generation when the task can be decomposed into generation and verification.

## Structured Instructions Make Output Usable

Another early failure was pleasant output that no system could use. The user asked for invoice fields and received a paragraph. The user asked for risks and received risks, evidence, and advice mixed into one block. Humans can read that. Programs cannot. If a downstream system cannot parse the answer, the prompt has not finished its job.

Structured output is not format vanity. It is a responsibility boundary. Field names tell downstream code where to read. Types tell validators what is illegal. Enums prevent the model from inventing new states. Missing fields give the system a clean failure mode. Even before strict JSON schema support became common, the direction was clear: the goal was not a pretty answer. The goal was a result that could enter a machine-checkable boundary.

A meeting memo prompt that asks for "concise professional writing" gives you no diagnostic handle. A prompt that asks for `decision`, `owner`, `deadline`, `evidence_quote`, and `confidence` gives you several. A missing owner is extraction failure. A non-ISO deadline is format failure. An evidence quote absent from the source is evidence failure. A confidence field that is always high is calibration failure. Specific errors create specific repairs.

## Prompt Changes Are Control-Plane Changes

Prompt edits are often treated like copy edits because they are text. In an AI system, one sentence can change business behavior. Replacing "may infer" with "must only use source material" changes the evidence policy. Replacing "briefly answer" with "explain in detail" changes cost and latency. Replacing "refuse if needed" with "never refuse" changes risk. A prompt is not ordinary prose. It is control-plane configuration.

That means prompts deserve version control, review, and regression examples. A prompt diff should be read for responsibility changes, not just wording. If a refusal condition is added, add refusal tests. If a field is removed, inspect downstream parsing. If an example changes, ask whether the output distribution changes. If a variable name changes, check whether logs or tools depended on the old name.

Model upgrades make this stricter. If the model and the prompt change at the same time, you cannot attribute behavior drift. A cleaner rollout fixes the prompt while testing a new model, then fixes the model while testing a new prompt. When both must change, keep a comparison set. Without that discipline, "the new version is better" is usually just a feeling.

## Teams Need Prompt Owners

Personal prompts can be fixed by the person who wrote them. Team prompts need owners. Someone must decide who can edit the template, who approves a change, who maintains examples, and who decides whether a failure belongs to the model, the prompt, the retrieval layer, or a downstream parser. A prompt with no owner becomes a configuration file with no owner. It works until it matters.

The owner does not need to know every domain detail. The owner maintains the boundary. The template should match the task. The examples should cover real edges. The output should match downstream contracts. Each change should have a reason. In support, finance, legal, medical, and code-generation workflows, a prompt sentence can change what the system does. Treating it as casual copy underestimates the risk.

Ownership also means deletion. Many prompts grow by patch accretion. Every incident adds a sentence to the end. Months later the template is full of duplicates, stale exceptions, and hidden conflicts. Long is not stable. Long is often just unmaintained. A good owner compresses the prompt, moves deterministic work to tools or schemas, and keeps natural language responsible only for the semantic boundary it can actually carry.

That boundary matters because some failures cannot be fixed by more wording. Missing evidence needs retrieval. Arithmetic needs a tool. Permission risk needs policy. Format drift needs schema. If every failure is pushed back into the prompt, the prompt becomes a landfill. A good prompt knows where it ends.

## The Reusable Part Is the Failure Boundary

The lesson to carry forward from late 2022 is not a favorite phrase. It is the habit of writing failure boundaries into the call. A good prompt tells the model when to answer and when not to answer. It tells the model how to use examples and what to do when the examples do not cover the case. It tells the model what to output and tells the next system how to reject bad output.

That is the split between toy prompts and production prompts. A toy prompt optimizes for the first surprising answer. A production prompt optimizes for the thousandth answer still being explainable. The first is rhetoric. The second is an interface. Prompt engineering mattered because it made the act of calling a model into something designable, reviewable, and portable.

For everyday work, this changes the first question. Do not start with "make this better." Start with what the input is, who will use the output, what evidence is allowed, which cases require refusal, and what fields the next system needs. That prompt may look plain. Plain is fine. Engineering begins when the call survives contact with the next person who has to maintain it.
