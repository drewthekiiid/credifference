# AGENTS.md

## Cursor Cloud Agents

- This repo uses the shared DBLVSN / The Agentsy kit.
- Project agents live in **`.cursor/agents/*.md`**. Cursor Cloud Agents can use them when these files are present in the branch the cloud agent clones.
- Use exact `name` values from `.cursor/agents` as `subagent_type`; `org-mcp` exposes `get_agent_roster`.
- Project rules live in **`.cursor/rules/*.mdc`** and should be treated as repo-scoped guidance in cloud sessions.
- Agent skill assignments are documented in **`docs/AGENT_SKILL_MAP.md`**. Skills are optional accelerators; if a named skill is unavailable in a cloud environment, continue with direct tools and workroom protocol rather than blocking.
