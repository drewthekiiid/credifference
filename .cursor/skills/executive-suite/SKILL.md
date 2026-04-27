---
name: executive-suite
description: Route company-level DBLVSN decisions through the executive suite before production starts.
disable-model-invocation: true
---

# Executive Suite

Use this skill when the work needs company-level DBLVSN judgment before production starts.

Steps:

1. Treat any text after `/executive-suite` as the executive brief.
2. Read `.cursor/agents/dblvsn-executive-suite.md`.
3. Identify which C-suite voices are relevant:
   - `dblvsn-ceo` for vision, standards, and final priority calls.
   - `dblvsn-coo` for operations, delivery, staffing, and process.
   - `dblvsn-cfo` for budget, margin, pricing, and investment tradeoffs.
   - `dblvsn-cro` for revenue, pipeline, partnerships, proposals, and commercial packaging.
   - `dblvsn-cmo` for market narrative, audience, channels, and go-to-market.
   - `dblvsn-cpo` for product direction, service packaging, roadmaps, and offer definition.
   - `dblvsn-cto` for technical strategy, platforms, architecture, and engineering standards.
   - `dblvsn-cco` for creative vision, taste, brand quality, and final creative bar.
   - `dblvsn-cdo` for data strategy, analytics, AI, measurement, and information architecture.
   - `dblvsn-chief-client-officer` for client health, stakeholder alignment, and account growth.
4. Return the executive decision, tradeoffs, risks, and a handoff mandate for `the-agentsy` if execution is needed.

Do not invent company facts, budgets, commitments, or legal constraints.
