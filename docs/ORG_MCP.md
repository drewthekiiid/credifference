# Cursor Org MCP

The shared Agentsy kit includes a local MCP server that gives DBLVSN and The Agentsy a shared workroom ledger.

It does not run agents by itself. Cursor still launches the subagents. The MCP server gives them a common place to coordinate: briefs, tasks, handoffs, decisions, approvals, status updates, and audit trails.

## Files

- MCP server: `tools/org-mcp/server.mjs`
- MCP package: `tools/org-mcp/package.json`
- Cursor config: `.cursor/mcp.json`
- Workroom state: `.cursor/org/workrooms/`

Generated workroom contents are local-only and gitignored by default because they may contain active project context, approval records, or operational notes.

## Setup

Install the local MCP dependencies once in the target repo:

```sh
cd tools/org-mcp
npm install
```

Cursor should then discover the `org-mcp` server from `.cursor/mcp.json`. If Cursor has already started, reload the window or restart Cursor after installing dependencies.

## Operating Pattern

1. A top-level agent uses `find_workrooms` to check for an active DBLVSN or Agentsy workroom, then creates one if needed before substantive analysis, implementation planning, code edits, or delegation.
2. The orchestrator records the brief and assigns coordination tasks.
3. Before delegating, the orchestrator creates a handoff packet for the next subagent.
4. Subagents mark assigned tasks `in_progress` with their exact agent name.
5. Subagents post updates and evidence into the same workroom.
6. Subagents mark tasks `completed` with their exact agent name when done.
7. Risky actions create approval records before execution.
8. Decisions and final outcomes are recorded before the workroom closes.

## Useful Tools

- `create_workroom`
- `create_followup_workroom`
- `find_workrooms`
- `get_agent_roster`
- `get_company_status`
- `assign_task`
- `update_task_status`
- `post_update`
- `create_handoff`
- `request_approval`
- `resolve_approval`
- `record_decision`
- `get_status`
- `close_workroom`
