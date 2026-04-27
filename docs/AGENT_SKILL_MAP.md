# Agent Skill Map

This repo assigns skills selectively. Agents should use a skill only when it materially fits the task, and must read that skill's `SKILL.md` before applying it.

## Principles

- Orchestrators know the skill map, but mostly route to specialists.
- Specialists get only the skills that match their domain.
- Do not add every skill to every agent. Broad skill lists make agents noisy and less predictable.
- Keep skill references cloud-portable: use skill names and project-relative docs, not absolute paths to local plugin caches.
- Skills are optional accelerators. If a named skill is unavailable in Cursor Cloud Agents, continue with direct tools and workroom protocol instead of blocking.

## Cloud Agent Availability

Cursor project subagents live in `.cursor/agents/*.md`. Cursor Cloud Agents can use those project agents when the files are present in the repository branch the cloud agent clones; no separate cloud-only roster file is documented.

Project rules under `.cursor/rules/*.mdc` and `AGENTS.md` are the right place for always-on cloud instructions. Project docs are available as normal repo files but should be referenced by rules, prompts, workrooms, or agents when they matter.

Cursor skills are discovered from skill folders such as `.cursor/skills/<skill>/SKILL.md`, `.agents/skills/<skill>/SKILL.md`, or user/global skill locations. This kit references shared skill names rather than vendoring those skills into the project. If cloud agents do not have those skills installed, they should proceed without them.

## DBLVSN / Agentsy

- Orchestration and planning: `ce-brainstorm`, `ce-plan`, `ce-doc-review`, `ce-proof`.
- Design and creative: `ce-frontend-design`, `canvas`, `screenshot`, `ce-demo-reel`, and `ce-gemini-imagegen` for explicit image work.
- Implementation and technical work: `ce-work`, `ce-debug`, `ce-code-review`, `ce-test-browser`.
- QA: `ce-code-review`, `ce-test-browser`, `ce-demo-reel`, `ce-debug`.
- Research: `ce-sessions`, `ce-slack-research`, `ce-doc-review`, `ce-plan`.
- Launch: `ce-commit`, `ce-commit-push-pr`, `ce-pr-description`, `ce-demo-reel`.

## Sources

- Cursor Subagents docs: https://cursor.com/docs/subagents
- Cursor Agent Skills docs: https://cursor.com/docs/skills
- Cursor Cloud Agents docs: https://cursor.com/docs/cloud-agent
- Cursor agent best practices: https://cursor.com/blog/agent-best-practices
