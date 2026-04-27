# Agentsy brief

Use this command when a request should be framed and routed through The Agentsy.

Steps:

1. Read `.cursor/agents/the-agentsy.md`, `.cursor/rules/cloud-agent-roster.mdc`, and `docs/AGENT_SKILL_MAP.md`.
2. Turn the user's request into a concise production brief:
   - desired outcome
   - constraints
   - relevant files or systems
   - definition of done
   - risks or approvals needed
3. Pick the smallest useful staff from `.cursor/agents/*.md`.
4. If substantial work is involved, include `agentsy-project-manager`.
5. Return:
   - recommended staff
   - handoff prompt for each agent
   - execution sequence
   - verification plan

If the user included task details after the slash command, use those details as the brief.
