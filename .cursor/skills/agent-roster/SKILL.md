---
name: agent-roster
description: Inspect the DBLVSN / The Agentsy project agent roster and pick the right specialist for a task.
disable-model-invocation: true
---

# Agent roster

Use this skill to inspect the DBLVSN / The Agentsy roster and pick the right specialist for the task.

Steps:

1. Read `.cursor/rules/cloud-agent-roster.mdc`, `AGENTS.md`, and `docs/AGENT_SKILL_MAP.md`.
2. Inspect `.cursor/agents/*.md` for exact `name` values and responsibilities.
3. Match the user's request to the smallest useful staff:
   - `dblvsn-executive-suite` for company-level decisions and cross-functional executive calls.
   - `the-agentsy` for creative technology orchestration and multi-specialist production work.
   - `agentsy-project-manager` for substantial work that needs scope, decisions, blockers, and next actions tracked.
   - `agentsy-technical-director` for architecture, implementation approach, boundaries, and engineering risk.
   - `agentsy-qa-director` for verification, regressions, and release confidence.
4. Return the recommended agent or agent team, the reason for each pick, and a ready-to-run handoff prompt.

If the user included task details after `/agent-roster`, use those details as the brief.
