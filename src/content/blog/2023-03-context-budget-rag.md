---
title: "上下文预算"
date: 2023-03-20
slug: "context-budget-rag"
status: draft
draft: true
---
RAG 原型能回答公司政策，真实上线后却把过期条款和当前条款一起塞进上下文。

## 问题机制

RAG 的核心问题不是“找几段相关文本”，而是决定哪些证据有资格占用 context。向量相似只能说明文本看起来接近，不能说明它适用、最新、完整。退款政策里一句“七天内可退”如果和下一句“定制商品除外”被切开，模型拿到的就是半个事实。

```bash
rg -n "定制商品|七天内" docs/policy
```

如果两句话落在不同 chunk，召回命中也可能制造错误答案。

真实系统里还会叠加历史状态。客服对话、知识库、产品配置和用户权限都想进入 prompt。窗口再长，也不是无限。把所有材料都塞进去，模型会在新旧规则之间折中，最后给出一个看似合理但无法追溯的答案。

## 最小方案

最小方案是让 chunk 带上结构和元数据，再在拼上下文前做过滤。不要只存正文，还要存标题、版本、更新时间和相邻段落。

```python
chunk = {
    "text": text,
    "section": "退款规则",
    "version": "2026-03",
    "updated_at": "2026-03-01",
    "neighbors": [prev_id, next_id],
}
```

检索后先过滤版本，再补相邻段落，最后才交给模型。这样 context 不是垃圾桶，而是预算表。

预算表还要写清优先级。当前政策高于历史公告，正式文档高于聊天摘录，用户所在地区的条款高于通用说明。最小实现可以在拼 prompt 前排序，并把来源一起交给模型。

```python
selected = sorted(candidates, key=lambda c: (c["version"], c["source_rank"]), reverse=True)
context = "\n\n".join(c["text"] for c in selected[:5])
```

## 边界风险

结构化 chunk 不能修复脏文档。PDF 页眉、旧公告、复制出来的表格都会污染索引。上线前要做一个最小截图检查：同一条政策在页面里完整显示，命中 chunk 也完整显示。

```bash
npm run build-rag-index
npm run inspect-chunk -- refund-policy
```

核心原则是把 context 当稀缺资源。相关性只负责把材料带到门口，预算分配决定谁能影响答案。

边界也要写清楚。遇到版本冲突、来源缺失、证据只命中半句时，系统应该要求人工确认或回答证据不足，而不是让模型补完。RAG 的可靠性不是来自 top-k 更大，而是来自让不合格证据没有资格进入上下文。

另一个风险是摘要污染。很多系统会把历史对话压成 summary，再和检索结果一起交给模型。summary 很省 token，但它会丢掉来源和时间。如果摘要里写“用户已经确认退款”，却没有链接到原始对话，模型会把它当事实。最小做法是给摘要也加来源字段，不能证明来源时就降低权重。

```python
memory = {"text": "用户询问退款", "source": "chat_182", "trusted": False}
```

RAG 还要接受一个现实：不是每个问题都该回答。用户问“这个订单一定能退吗”，系统只找到通用政策，没有订单类型和购买时间，就应该返回缺证据。最小输出可以包含 `missing_fields`，让前端继续追问。

```python
answer = {"status": "insufficient_evidence", "missing_fields": ["order_type", "paid_at"]}
```

如果产品一定要求给出答案，也要把置信边界写进输出。比如“根据通用政策，可能可退；缺少订单类型”。这比装作证据完整更诚实。

<!-- social -->
RAG 的难点不是把文本塞进模型，而是让正确、完整、当前的证据占用有限的 context。
