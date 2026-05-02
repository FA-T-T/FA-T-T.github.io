---
title: "函数调用协议"
date: 2023-11-10
slug: "function-calling-protocol"
status: draft
---
模型说“我会帮你订票”并不危险，危险的是系统直接把这句话当成订票动作执行。

## 问题机制

函数调用的价值不是让模型能用更多工具，而是把意图变成可检查的参数对象。没有协议时，运行时只能解析散文。日期、地点、数量、确认状态都可能被模型写在理由里，解析器很难区分哪句是动作。

```javascript
const text = "帮用户订明天去上海的票，先确认价格";
```

这句话包含目的地和时间，也包含“先确认”。如果系统只抽取城市和日期，就会跳过确认边界。

散文解析还有一个坏处：失败很难复盘。日志里只有一段自然语言，无法判断模型到底是没有理解确认步骤，还是解析器丢了这部分。协议化以后，错误会落在字段上，排查路径短得多。

## 最小方案

最小方案是给工具一个 schema，并让运行时验证参数后再执行。模型只能提出动作对象，不能直接改变世界。

```javascript
const toolCall = {
  name: "create_booking",
  arguments: {
    destination: "上海",
    date: "2026-05-03",
    requires_confirmation: true
  }
};
```

运行时看到 `requires_confirmation`，就应该暂停并展示确认摘要。这样错误会停在动作前，而不是进入支付或写库之后。

还要给结果加信封。工具不应该只返回一段成功文本，而要返回状态、错误码和可重试标记。模型看到 `needs_user_confirmation`，就继续问用户；看到 `permission_denied`，就停止。

```javascript
const result = {
  status: "needs_user_confirmation",
  summary: "上海 2026-05-03",
  retryable: false
};
```

## 边界风险

schema 只能检查形状，不能检查业务正确性。日期可能合法但不符合用户时区，金额可能是数字但超过预算。高风险工具还需要幂等键、权限检查和审计日志。

```bash
node scripts/replay-tool-call.js run_042 --dry-run
```

核心原则是让模型生成可验证动作，让运行时负责执行边界。函数调用不是自动化许可，而是执行前的闸门。

函数调用也不能替代产品权限。用户无权订票时，schema 再漂亮也不能执行。工具输出来自网页或第三方系统时，也要当作不可信数据，而不是新的指令。协议让动作可见，但最终边界仍然属于运行时。

并行调用也要小心。模型可能同时请求查库存、算价格和创建订单。前两个可以并行，第三个必须等确认。最小规则是把工具分成 `read` 和 `write`。读工具可以自动执行，写工具必须有确认或权限检查。

```javascript
const policy = { get_price: "read", create_order: "write" };
```

协议还需要版本号。工具参数一变，旧日志就可能无法重放。比如 `date` 从自然语言改成 ISO 字符串，旧调用不能默默进入新工具。最小做法是在 tool call 里记录 `schema_version`，运行时发现不匹配就拒绝。

```javascript
const call = { schema_version: "booking.v2", arguments: toolCall.arguments };
```

最后还要保存原始用户请求和工具参数。事故发生时，团队要能回答：模型理解错了，schema 太松，还是运行时越权执行。没有这三段日志，复盘只能猜。

能复盘，协议才算真正落地，也才配进入生产路径和真实业务执行流程。

<!-- social -->
函数调用真正重要的不是工具数量，而是把模型意图变成可验证、可拒绝、可回放的动作协议。
