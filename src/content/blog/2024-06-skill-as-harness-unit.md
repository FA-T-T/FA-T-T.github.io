---
title: 第四讲｜Skill 作为 Harness 单元：定义、结构与最小 YAML 示例
description: 定义 skill 的边界，并给出可落地的标准文件结构与“维基速览”最小示例。
deck: 提示模板和工具清单不足以长期维护，skill 需要把执行要素封装为可版本化资产。
date: 2024-06-18
tags:
  - harness
  - skills
  - yaml
use_math: false
draft: false
---

一个常见团队现场是这样的：共享文档里有几十条 prompt，代码库里有一堆工具封装，知识库里还有另一套检索配置。新成员想复现某个“效果很好”的流程，最后只能靠口口相传。2024 年 skill 化的价值，就在于终结这种隐性知识依赖。

skill 需要被明确定义：它不是一句提示词，也不是一个 API wrapper，而是把系统指令、任务提示、工具清单、上下文生成策略、输出校验规则封装在一起的可组合模块。模块边界清晰后，执行行为才能被版本化、测试化、审计化。

一个可执行的最小 skill 结构如下：

```yaml
name: wiki_quick_view
version: 1.0.0
prompts:
  system: |
    你是事实核查助手。只能基于检索结果回答，禁止编造来源。
  task: |
    根据用户查询生成分段摘要，每段聚焦一个子主题。
tools:
  - name: search_wikipedia
    description: Search Wikipedia pages and return snippets.
    parameters:
      type: object
      properties:
        query:
          type: string
        top_k:
          type: integer
          minimum: 1
          maximum: 10
      required: [query]
context:
  retrieval:
    tool: search_wikipedia
    query_template: "{user_query}"
    top_k: 3
    fields: [title, snippet, url]
outputs:
  format: json
  schema:
    type: object
    properties:
      summary:
        type: array
        items:
          type: object
          properties:
            topic: { type: string }
            paragraph: { type: string }
            citations:
              type: array
              items: { type: string, format: uri }
          required: [topic, paragraph, citations]
    required: [summary]
```

这个示例的关键不是字段齐全，而是执行闭环完整。`prompts` 约束行为边界，`tools` 约束输入参数，`context` 规定证据来源与注入方式，`outputs` 规定下游可解析结构。任何一段缺失，skill 都会退化成“描述性文档”而不是“可执行资产”。

业内对 skill 的争议集中在“是否过度工程化”。反对者认为直接写 prompt 更快；支持者强调可维护性。两边都触及真实问题：探索期确实要快，但一旦进入多人协作与上线阶段，没有模块化定义就无法回归测试、灰度发布和责任追踪。可取策略是双轨：探索期轻量模板，固化期升级为 skill 文件并纳入版本控制。

从生活角度看，skill 有点像菜谱而不是菜。菜好吃靠厨师临场，菜谱可复现靠步骤和配比。企业要的不是“某位高手偶尔发挥”，而是“不同人、不同时间、不同流量下都能稳定产出”。这正是 skill 作为 harness 单元的现实意义。
