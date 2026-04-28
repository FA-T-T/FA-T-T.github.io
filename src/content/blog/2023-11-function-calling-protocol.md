---
title: "Part 3 | Function Calling Protocols: From Plugins to Schemas and Parallel Tools"
description: 'Function calling matters less because models can use more APIs, and more because intent, parameters, execution, and results can be placed inside a verifiable I/O protocol.'
deck: 'The 2023 shift was not tool quantity. It was responsibility boundary: the model maps intent to structured arguments, while the runtime validates, executes, retries, refuses, and audits.'
date: 2023-11-10
tags:
  - function-calling
  - json-schema
  - tools
use_math: false
draft: false
---

Function calling is often summarized as "models can call tools now." That is true and too coarse. The real change was that a verifiable protocol appeared between the model and the tool. Without that protocol, the model translates a user request into prose and a fragile parser tries to guess what action should happen. With the protocol, the model produces a typed object with fields, required keys, enums, and constraints. The runtime can validate it, reject it, repair it, execute it, and feed the result back.

When OpenAI introduced [function calling](https://openai.com/index/function-calling-and-other-api-updates/) in June 2023, the key move was simple: developers described functions, and the model could choose a function and produce JSON arguments. That turned the model from an answer generator into something closer to an intent-to-arguments compiler. The compiler analogy is imperfect because the model is probabilistic and has no strict semantics. Still, it captures the right boundary. The model should not directly execute the world. It should first produce a plan that can be checked.

The plugin era had already shown that models could connect to external systems. It also exposed the dangerous part. Tool output can contain untrusted content, and untrusted content can instruct the model to take unintended actions. The OpenAI announcement explicitly warned about that class of risk and recommended user confirmation before actions with real-world impact. That warning mattered as much as the feature. Tool use does not merely extend the model. It connects the model to permission, money, data, and state. If the protocol is soft, capability makes failure harder to locate.

## Parsing Prose Is Not a Protocol

The naive integration is tempting. The user says, "Check the weather in Beijing tomorrow." The model replies, "Call the weather API with location Beijing and date tomorrow." A parser extracts those words. The demo works. The production system breaks. Prose has no stable fields. "Tomorrow" depends on timezone. "Beijing" may appear in the reason rather than the destination. Unit preference may be implicit. Once a real API call is involved, these ambiguities become bad parameters.

Protocol starts when "what to say" becomes "what to fill." The weather tool is not a paragraph. It is a schema. `location` is a string. `date` is an ISO date. `unit` is one of two values. The model's job is to project user intent into the object. If the object cannot be filled, it should ask or refuse. It should not invent.

```json
{
  "name": "get_weather",
  "description": "Fetch the weather forecast for a location and date.",
  "parameters": {
    "type": "object",
    "properties": {
      "location": { "type": "string" },
      "date": {
        "type": "string",
        "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
      },
      "unit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"]
      }
    },
    "required": ["location", "date"]
  }
}
```

This schema does not make the model smarter. It makes errors legible. `date: "tomorrow"` is a format error. `unit: "kelvin"` is an enum error. A missing `location` is a required-field error. Once the error is legible, the runtime can return targeted feedback and ask the model to repair the object. Function calling turns vague language drift into interface failure.

## Responsibility Must Be Split

A reliable tool system has at least three layers. The model layer maps intent to a candidate call. The validation layer checks fields, permissions, budgets, risk, and dependencies. The execution layer calls the real system and handles timeout, retry, idempotency, rollback, and logs. If those layers collapse into one, failures collapse too. A wrong tool is intent failure. An invalid argument is schema failure. A service 500 is execution failure. A denied action is policy failure. The split tells the team what to fix.

That is why function calling is not the same as letting the model write code and run it. Direct execution is flexible and unsafe. A model-generated SQL query may solve the task and delete the wrong data. A safer design treats the query as an intermediate artifact. The runtime applies read-only constraints, table allowlists, cost estimates, and permission checks before execution. The protocol's value is not the action. It is the pause before the action.

That pause may look expensive in low-risk tasks. In high-risk tasks it is the system. Sending email, filing expense reports, changing permissions, purchasing goods, deploying services, and updating databases all require a boundary. The model can propose. The runtime must decide whether the proposal may happen.

## Structured Outputs Tighten the Contract

Structured outputs pushed the same direction further. OpenAI's later [Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) work distinguished valid JSON from schema-conforming output. That distinction matters. `{ "foo": "bar" }` is valid JSON. It is not a valid weather API call. A schema-conforming object is eligible for business validation.

Even strict schema adherence is not the whole safety story. A schema can validate date format, but not whether the date is in the supported forecast range. A schema can validate amount type, but not whether the user may spend that amount. A schema can validate recipient format, but not whether an external attachment is allowed. Schema is the first mechanical gate. Business policy comes after.

This division makes downstream systems cleaner. Without schema, policy must first guess what the model meant. With schema, policy can inspect a known object. That is a different class of system.

## Parallel Tool Calls Change Latency and Failure

Serial tool calls accumulate latency. A research request may need web search, local file reads, issue lookup, and a small script. Running them one after another feels slow. Parallel calls can turn sum latency into max latency. That is the obvious win.

Parallelism also changes the failure model. Independent read-only calls can run together. A create-customer call and a create-order call cannot be parallelized casually. One tool may timeout while another succeeds. The aggregation layer must know whether to continue, retry, degrade, or fail the whole run.

That requires result envelopes. A tool result should include tool name, call ID, input digest, output, error, duration, retry count, and source. Without the envelope, aggregation receives only text. With the envelope, the system can reason that web search failed but local evidence is enough, or that two sources conflict, or that a database call succeeded while an external API timed out.

Structured output constraints can also interact with parallelism. Some strict schema modes do not compose cleanly with free parallel tool generation. That is not a footnote. It is the general rule: the harder the protocol, the more explicit coordination parallelism needs.

## Outputs Need Protocol Too

Many systems specify tool inputs and leave tool outputs as prose. That is a trap. A retrieval tool should not return loose snippets. It should return `source_id`, `title`, `url`, `retrieved_at`, `score`, and `text`. A payment tool should not return "success." It should return `transaction_id`, `status`, `amount`, `currency`, `created_at`, and `requires_followup`. A failure should not be an unstructured exception. It should land in an error object.

Bidirectional structure enables testing and replay. You can record a tool call and see whether the model integrates the same result the same way after a model upgrade. You can measure timeout rate, empty-result rate, argument-repair rate, and tool-selection drift. None of that comes from telling the model "please be strict."

Tool output is also an attack surface. Web pages, emails, tickets, repositories, and documents can contain instructions. The runtime must label tool output as data, not instruction. It must preserve source and trust level. It must prevent an untrusted page from silently causing a write action. Input schema is not enough. Output envelopes and trust tags are part of the same protocol boundary.

## Tool Choice Is Policy

Argument generation gets most of the attention, but tool choice is also a policy decision. A system may expose `search_web`, `search_internal_docs`, `read_file`, `query_database`, `send_email`, and `create_ticket`. "Look this up" is not enough to decide among them. Public web is cheap and sometimes unreliable. Internal docs are more authoritative but permissioned. Databases may be current but expensive. Write tools can solve a problem and create side effects.

The runtime should annotate tools with capability, risk, cost, permission, and side effects. The model may propose candidate tools. Policy should filter them. Read-only tools can be freer. Write tools need confirmation. Cross-permission tools need authorization. High-cost tools need budget checks. If the system only records that a tool was called, it misses the important question: why was that tool allowed.

Tool descriptions are part of this policy surface. A tool described as "search documents" will match too many tasks. "Search approved compliance policies updated by the compliance team" is more useful. The description is not just help text. It is routing input.

## Idempotency Decides Whether Retry Is Safe

Tools fail. Networks timeout. Services return 500. Rate limits trigger. Partial writes happen. A system that retries automatically must know whether retry is safe. Reading a file is safe. Querying weather is safe. Creating an order, sending email, charging a card, and posting a notification may not be safe.

Write tools should declare idempotency, `idempotency_key` support, dry-run support, rollback behavior, and confirmation requirements. The runtime should not ask the model whether to "try again" without knowing whether the previous attempt already changed state. The model cannot know that from prose. The tool envelope can.

Success is also not a single status. A service can accept a request and process it later. A deployment can start successfully and fail health checks. An email service can accept a message and later bounce it. The result object should distinguish `accepted`, `completed`, `failed`, `pending`, and `requires_confirmation`. Otherwise the model will conclude too early.

## Schemas Evolve

Function schemas are APIs. APIs evolve. Fields are added. Old fields are deprecated. Enums expand. Permissions change. If the tool layer has no version concept, schema changes create hidden failures. A prompt still asks for `user_id` while the tool expects `account_id`. A new enum value appears and the model never uses it. A required field is added and the model invents a value.

Every tool needs a version. The description seen by the model should correspond to that version. Deprecated fields need a transition period. New required fields need a questioning path. Enum expansion needs evaluation examples. Schema changes need a changelog and regression tests. Traditional API design already learned this. Function calling moves those lessons into the model interface.

## Human Confirmation Is Part of the Protocol

Automation culture often treats human confirmation as failure. In low-risk tasks, maybe. In high-risk tool use, confirmation is a protocol step. Before sending an email, show recipient, subject, body summary, and attachments. Before placing an order, show amount, item, and address. Before deployment, show environment, version, and rollback plan. The user should confirm an object, not a vague sentence.

The confirmation snapshot should be logged. Later, the system can say what the user approved. This adds friction in the right place: before side effects. The goal is not frictionless action. The goal is controlled action.

## The Interface Text Becomes System Behavior

Tool names, parameter names, descriptions, and error messages used to be internal developer text. In a model-facing tool system they become part of runtime behavior. A parameter called `q` is weaker than `search_query`. A boolean called `fast` is weaker than `response_mode: "fast" | "thorough"`. A `400 Bad Request` error is less repairable than `missing_required_field: date`.

Function calling forces API design and prompt design to meet. The interface must explain itself because the model is one of its users. Bad API text creates bad model behavior. Good schema names and clear errors give the model a path to repair.

## Protocol Is the Gap Between Chat and Execution

The significance of 2023 function calling was not that a chatbot could check the weather. That was the smallest demo. The significance was that model output could become a verifiable intermediate representation. It could be validated, rejected, approved, executed, replayed, and measured.

Without that representation, AI applications struggle to leave the toy stage. Real systems care less about whether an answer sounds plausible and more about whether an action is correct, authorized, reversible, and attributable. Function calling is the bridge: prompt turns a task into a contract, RAG supplies evidence, and function calling turns intent into an action plan. The number of APIs is secondary. The protocol around each call is what makes the system maintainable.
