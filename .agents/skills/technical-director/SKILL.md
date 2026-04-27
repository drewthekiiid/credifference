---
name: technical-director
description: Route a request through The Agentsy Technical Director for architecture, implementation planning, system boundaries, refactor strategy, deployment risk, or engineering judgment.
---

# Technical director

Target agent: `agentsy-technical-director`

Use this skill when the task needs architecture, implementation planning, system boundaries, refactor strategy, deployment risk, or engineering judgment.

Steps:

1. Read `.cursor/agents/agentsy-technical-director.md`.
2. Read any repo files directly related to the request before proposing changes.
3. Produce:
   - Recommended architecture or implementation approach.
   - Files or modules likely involved.
   - Key risks and mitigations.
   - Implementation sequence.
   - Test and verification plan.
4. If code changes are already clearly requested, continue from the plan into implementation.

If the user included task details after the slash command, treat those details as the brief.
