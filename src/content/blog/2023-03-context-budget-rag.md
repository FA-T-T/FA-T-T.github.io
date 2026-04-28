---
title: "Part 2 | Context Budget: RAG Chunking, Reranking, and Signal Ordering"
description: 'The hard part of RAG is not retrieving related text. It is deciding which evidence deserves scarce context and what responsibility each token carries.'
deck: 'Larger context windows did not remove the engineering problem. They changed it from "can we fit the material" to "which material has the right to influence the answer."'
date: 2023-03-20
tags:
  - context
  - rag
  - retrieval
use_math: false
draft: false
---

RAG looks simple in a demo. Split documents into chunks, embed them, retrieve top-k, paste the chunks into a prompt, and let the model answer. The pipeline is easy to explain and easy to prototype. It breaks as soon as the material becomes real. Failure does not always come from missing the relevant document. It often comes from placing stale evidence, half a definition, a near miss from another product, an unattributed summary, and a piece of old conversation state into the same context window. The model is not answering from evidence. It is guessing which part of a noisy room should count as evidence.

The important 2023 shift was not that vector retrieval finally worked. It was that context became a budget. Every token has an opportunity cost. More conversation history means less room for evidence. Longer evidence blocks mean fewer candidates. A fact placed in the middle of a long context may be less usable than the same fact placed near the beginning or end. [Lost in the Middle](https://arxiv.org/abs/2307.03172) made this concrete: long-context models can accept large inputs without using all positions equally well.

The original [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401) paper already identified the pressure. Parametric models contain knowledge but are hard to update and inspect. Retrieval can bring external knowledge into generation time and attach sources. Once teams built production systems around that idea, another fact became obvious: external knowledge is not clean by default. Retrieval brings candidates to the door. Context construction decides who enters, where they sit, and how much authority they get.

## Fixed Chunks Turn Boundary Errors into Recall Errors

Early RAG pipelines often used fixed-size chunks. Cut every 500 tokens with 50 tokens of overlap. The method is simple and cheap to index. It also cuts across semantic boundaries. A definition may begin in one chunk and the exception may fall into the next. A table header may be separated from the rows. A code sample may lose its import or error handler. The retrieval system says it found a relevant chunk. The answer system receives half a fact.

Half a fact is more dangerous than no fact. Suppose a user asks whether an order can be refunded. The system retrieves "orders can be refunded within seven days" but misses the following sentence, "customized items are excluded." The model gives a confident yes because the context contains a yes. That is not the cartoon version of hallucination. It is evidence truncation. The model did not invent a policy. The system handed it an incomplete policy.

Structure-aware chunking exists to reduce that failure. Headings, paragraphs, lists, tables, code blocks, and FAQ pairs are closer to responsibility boundaries than token counts. A refund rule should stay with its exceptions. An API parameter table should keep headers with rows. A code example should keep setup, call, and error handling together. The closer the chunk is to a self-contained unit of meaning, the more likely it can bear evidential weight.

Structure-aware chunking is not magic. It depends on parsing quality. Markdown, HTML, PDF, scanned documents, and exported knowledge bases all have different dirty edges. A parser can mistake footers for body text, page headers for section headings, or tables for broken paragraphs. The practical design is not to worship a chunker. It is to preserve raw location, parent heading, neighboring chunks, document version, and source metadata so that retrieval can expand around a hit instead of treating one fragment as complete.

## Vector Similarity Only Answers "Does This Look Related?"

Vector retrieval is good at semantic neighborhood. It is weaker at applicability. A stale policy and a new policy can be very similar. A historical discussion of an error code and a current fix note can be very similar. A general deployment guide and today’s failing CI log can be very similar. If the system only asks which text looks related, it will confuse topicality with decision value.

That is why reranking became central. First-stage retrieval can be broad. It should bring back candidates. The second stage must be pickier. It should decide which candidates deserve the budget. Good reranking uses more than embedding similarity: freshness, source type, version, field match, entity alignment, permissions, and task type. Policy questions need time and authority. Code questions need version and environment. Medical, legal, and financial questions need source class and scope.

A useful context candidate is not just text:

```json
{
  "text": "Customized items are not covered by the seven-day refund policy.",
  "source": "refund_policy_v4.md",
  "section": "Exceptions",
  "updated_at": "2023-03-12",
  "doc_version": "v4",
  "retrieval_score": 0.78,
  "rerank_score": 0.93,
  "entities": ["customized items", "seven-day refund"],
  "applies_to": ["retail", "customized_goods"]
}
```

Those fields are not decoration. They explain why the candidate should enter the context. If two passages are similar, prefer the newer one. If two are new, prefer the one with entity match. If both match, prefer the official policy over a comment thread. Without these signals, RAG becomes a semantic paste machine.

## A Bigger Window Changes the Shape of the Budget

It is tempting to think large context windows make RAG simpler. They do reduce one kind of pain. You can fit more history and more documents. But capacity is not attention, and capacity is not noise control. Large windows can hide failure. With a small window, the system visibly runs out of space. With a large one, the system may quietly bury the decisive evidence inside twenty similar passages and still produce a fluent answer.

Budgeting becomes more important because the failure becomes less obvious. A sane context design separates several budgets. The task budget carries the user question, role, constraints, and output format. The evidence budget carries retrieved passages and metadata. The state budget carries conversation summary, open decisions, and user preferences. The audit budget carries source IDs, retrieval time, ranking scores, and excluded evidence. These budgets serve different responsibilities. Mixing all of them into one long prompt lets responsibilities contaminate each other.

The proportions should change by task. Question answering needs more evidence. Writing needs more style and structure. Long-running workflows need more state. High-risk work needs more audit. There is no universal ratio. There is only a runtime policy that decides what the answer needs to be trustworthy.

## Summaries Should Preserve State, Not Just Shorten Text

The common shortcut is to summarize long material and call the budget problem solved. Bad summaries delete the branch conditions that matter. In policies, contracts, code changes, and experiment logs, the decisive information often lives in exceptions, versions, applicable scope, conflicts, and unresolved questions. Remove those and the model will make a cleaner mistake.

A useful compression target is not "shorter text." It is decision state. A state summary should separate confirmed facts, unresolved facts, conflicting evidence, next retrieval questions, and user constraints. It should not sand uncertainty into a smooth paragraph. If a summary layer erases uncertainty, downstream generation treats the uncertainty as absent.

For a research workflow, the state may look like this:

```text
confirmed:
  The user wants a comparison of context-budget problems in RAG engineering after 2023.
open_questions:
  Whether to cover specific frameworks is not yet decided.
conflicts:
  Some sources argue large windows reduce pipeline complexity.
  Others show long-context position sensitivity.
next_retrieval:
  Find evidence on position sensitivity in multi-document QA.
```

That is not a shorter document. It is working memory. It tells the next retrieval step what to search for and tells generation which claims cannot be written as settled facts.

## Query Rewriting Is the First Budget Allocation

RAG discussions often focus on documents and ignore the query. Before a user question reaches retrieval, it may need rewriting. The goal is not nicer prose. The goal is harder retrieval keys. "Why did this break today?" is not enough. The system needs the module, date, error class, version, and whether "break" means exception, latency, or wrong output.

Good query rewriting expands references, time, entities, and task type. If session state contains the current project, include it. If the user says "today," convert it to an absolute date. If the user pastes a log, extract error codes, function names, and versions. If the user asks "can I," the retrieval should look for rules and exceptions. The rewritten query should make the retrieval system less dependent on guesswork.

Query rewriting can also damage the task. It can over-interpret the user, convert an open question into a closed one, or treat a hypothesis as a fact. Preserve the original query, the rewritten query, and the rewrite reason. When the answer fails, you can tell whether the original request was ambiguous or the rewrite layer bent it in the wrong direction.

## Metadata Is Retrieval's Second Language

Many systems index only body text. Body text matters, but metadata often decides whether evidence can be used. Title, section, author, update time, version, permission scope, product line, language, and source credibility all affect applicability. Without metadata, the reranker must infer institutional status from prose. It will mix drafts with approved policies, historical notes with current rules, and discussion threads with specifications.

Metadata reduces model burden. Do not ask the model to determine freshness from twenty passages if the index can rank by document version first. Do not ask the model to infer authority if sources can be labeled. The model should synthesize text, not compensate for absent data governance. RAG reliability comes as much from upstream content hygiene as from generation.

Document lifecycle is part of that hygiene. Drafts can be indexed, but should be labeled as drafts. Deprecated documents can be kept, but should be downranked and marked historical. Official documents should carry release status, time, and scope. Temporary announcements should expire. Without lifecycle fields, a RAG system exposes the organization’s knowledge mess directly to the user.

## Evaluation Must Decompose the Pipeline

If RAG evaluation only asks whether the final answer is correct, it cannot locate failure. A wrong answer may come from query rewriting, recall, reranking, compression, context ordering, generation, or citation. One accuracy number turns all of those into fog.

Evaluation should decompose. First ask whether the gold evidence appears in top-N retrieval. Then ask whether it survives reranking into the final context. Then ask whether the context keeps enough semantic boundary and source metadata. Then ask whether generation uses the evidence correctly, handles conflict, and names missing information. Finally ask whether key claims cite the right source.

This catches accidental correctness. The model may answer from parametric memory even when retrieval failed. It may retrieve the right evidence and cite the wrong source. It may answer correctly but ignore scope. If you only score the final prose, these failures disappear until the next case breaks.

## Refusal Is a RAG Capability

RAG systems should answer from evidence. That means they must also know when not to answer. If the evidence is missing, the system should not produce a firm conclusion. If sources conflict and no rule resolves the conflict, it should name the conflict. If the user’s question is outside the indexed domain, it should say so instead of falling back to parametric memory.

Refusal must be tied to risk. A low-risk encyclopedia answer can offer a qualified summary. Legal, medical, financial, compliance, and code-deployment questions need stricter evidence thresholds. If retrieval finds only an old version of a migration guide, the system can say what it found and recommend checking version differences. It should not issue current commands as if the evidence were current.

A good refusal is not a dead end. It tells the user what is missing: a version number, an error log, a policy link, a jurisdiction, a contract clause, or a permission scope. The refusal becomes the next input. A bad refusal says only "I cannot answer."

The same signal helps the content system. Frequent refusals due to missing versions indicate weak metadata. Frequent refusals due to conflict indicate knowledge-base governance problems. Frequent refusals due to unclear permissions indicate access control has not entered retrieval. Refusal is not just a safety behavior. It is a diagnostic.

## The Opposite of RAG Is Not No Retrieval

A model with no retrieval can be stale. A model with unbounded retrieval can be worse. It can produce a sourced answer from sources that should not have been used. The first looks like closed-book uncertainty. The second looks like open-book confidence with the wrong book.

Mature RAG answers four questions. How do we chunk without breaking semantic responsibility. How do we rank without confusing similarity with applicability. How do we allocate context without burying the decisive evidence. How do we cite and refuse so that inference does not masquerade as fact. Missing any one of those, the system can look smart in a demo and become unreviewable in real work.

For personal use, the lesson is plain. Do not dump ten documents into a model and call it research. First define the question, the decision criteria, the source types, and the missing-information policy. Then ask for evidence, conflicts, gaps, and only then a conclusion. You are not building a chatbot with a larger memory. You are building a small evidence allocation system.
