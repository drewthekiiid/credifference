#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_MARKERS = ["AGENTS.md", ".cursor"];
const ORGANIZATIONS = ["dblvsn", "agentsy", "shared"];
const WORKROOM_PHASES = ["intake", "strategy", "research", "design", "implementation", "qa", "launch", "ops"];

const rootDir = await findRepoRoot(process.env.ORG_MCP_ROOT || process.cwd());
const orgDir = path.join(rootDir, ".cursor", "org");
const workroomsDir = path.join(orgDir, "workrooms");
const agentsDir = path.join(rootDir, ".cursor", "agents");

const server = new McpServer({
  name: "org-mcp",
  version: "0.1.0",
});

server.tool(
  "create_workroom",
  "Create a shared DBLVSN/Agentsy workroom with a durable brief and audit log.",
  {
    organization: z.enum(ORGANIZATIONS).describe("Owning organization for the workroom."),
    title: z.string().min(3).describe("Short human-readable workroom title."),
    goal: z.string().optional().describe("Definition of success or desired outcome."),
    owner_agent: z.string().optional().describe("Agent accountable for keeping the workroom current."),
    requester: z.string().optional().describe("Human or agent that requested the work."),
    context: z.string().optional().describe("Relevant background that child agents need."),
    tags: z.array(z.string()).optional().describe("Searchable workroom tags."),
    phase: z.enum(WORKROOM_PHASES).default("intake").describe("Current phase of work."),
    parent_workroom_id: z.string().optional().describe("Prior workroom this continues from."),
    desired_outcome: z.string().optional().describe("Overall project outcome, e.g. design-only, build, deploy, research proof."),
  },
  async (input) => {
    const { workroomId, dir } = await createWorkroomInternal(input);

    return jsonText({
      workroom_id: workroomId,
      path: relativeRepoPath(dir),
      status: "open",
      next_steps: [
        "Use assign_task for owners and deliverables.",
        "Use create_handoff before launching another subagent.",
        "Use request_approval before external, destructive, spending, deployment, or live-trading actions.",
      ],
    });
  },
);

server.tool(
  "create_followup_workroom",
  "Create the next phase workroom from a completed or in-progress workroom and seed phase-appropriate tasks.",
  {
    source_workroom_id: z.string().min(1),
    phase: z.enum(WORKROOM_PHASES),
    title: z.string().optional(),
    goal: z.string().optional(),
    owner_agent: z.string().optional(),
    requester: z.string().optional(),
    context: z.string().optional(),
    tags: z.array(z.string()).optional(),
    created_by: z.string().optional(),
  },
  async (input) => {
    const sourceDir = await requireWorkroom(input.source_workroom_id);
    const source = await readWorkroomStatus(sourceDir, 10);
    const title = input.title || `${source.metadata.title} - ${titleForPhase(input.phase)}`;
    const goal = input.goal || defaultGoalForPhase(input.phase, source.metadata);
    const tags = [...new Set([...(source.metadata.tags || []), input.phase, "follow-up"])];
    const context = input.context || renderFollowupContext(source, input.phase);
    const { workroomId, dir, metadata } = await createWorkroomInternal({
      organization: source.metadata.organization,
      title,
      goal,
      owner_agent: input.owner_agent || defaultOwnerForPhase(input.phase, source.metadata.organization),
      requester: input.requester || input.created_by || source.metadata.requester || "unknown",
      context,
      tags: input.tags || tags,
      phase: input.phase,
      parent_workroom_id: source.metadata.id,
      desired_outcome: desiredOutcomeForPhase(input.phase),
    });

    const tasks = await seedPhaseTasks({
      dir,
      phase: input.phase,
      organization: metadata.organization,
      source,
      createdBy: input.created_by || input.owner_agent || "org-mcp",
    });

    await appendAudit(sourceDir, "followup_workroom_created", input.created_by || "org-mcp", {
      followup_workroom_id: workroomId,
      phase: input.phase,
      title,
    });
    await attachChildWorkroom(sourceDir, workroomId, input.phase);

    return jsonText({
      source_workroom_id: input.source_workroom_id,
      followup_workroom_id: workroomId,
      phase: input.phase,
      path: relativeRepoPath(dir),
      seeded_tasks: tasks,
    });
  },
);

server.tool(
  "find_workrooms",
  "Find workrooms by organization, title/goal text, owner, status, or tags.",
  {
    organization: z.enum(ORGANIZATIONS).optional(),
    query: z.string().optional().describe("Case-insensitive text match against title, goal, requester, owner, and tags."),
    tags: z.array(z.string()).optional(),
    owner_agent: z.string().optional(),
    include_closed: z.boolean().default(false),
    limit: z.number().int().min(1).max(100).default(20),
  },
  async (input) => {
    const workrooms = await listWorkroomMetadata({
      organization: input.organization,
      query: input.query,
      tags: input.tags || [],
      ownerAgent: input.owner_agent,
      includeClosed: input.include_closed,
    });

    return jsonText({
      count: workrooms.length,
      workrooms: workrooms.slice(0, input.limit),
    });
  },
);

server.tool(
  "get_company_status",
  "Summarize active workrooms, blockers, pending approvals, owners, and next actions across the org.",
  {
    organization: z.enum(ORGANIZATIONS).optional(),
    include_closed: z.boolean().default(false),
    recent_limit: z.number().int().min(1).max(10).default(3),
  },
  async (input) => {
    const workrooms = await buildCompanyStatus(input);
    const organizations = {};

    for (const workroom of workrooms) {
      const org = workroom.organization;
      organizations[org] ||= {
        open_workrooms: 0,
        closed_workrooms: 0,
        pending_approvals: 0,
        blocked_tasks: 0,
        open_tasks: 0,
      };
      if (workroom.status === "closed") {
        organizations[org].closed_workrooms += 1;
      } else {
        organizations[org].open_workrooms += 1;
      }
      organizations[org].pending_approvals += workroom.pending_approvals.length;
      organizations[org].blocked_tasks += workroom.blocked_tasks.length;
      organizations[org].open_tasks += workroom.open_tasks.length;
    }

    return jsonText({
      generated_at: nowIso(),
      organization: input.organization || "all",
      totals: {
        workrooms: workrooms.length,
        open_workrooms: workrooms.filter((workroom) => workroom.status !== "closed").length,
        pending_approvals: workrooms.reduce((sum, workroom) => sum + workroom.pending_approvals.length, 0),
        blockers: workrooms.reduce((sum, workroom) => sum + workroom.blockers.length + workroom.blocked_tasks.length, 0),
        open_tasks: workrooms.reduce((sum, workroom) => sum + workroom.open_tasks.length, 0),
      },
      organizations,
      workrooms,
    });
  },
);

server.tool(
  "get_agent_roster",
  "List exact Cursor subagent_type names available in this repo, optionally filtered by organization.",
  {
    organization: z.enum(ORGANIZATIONS).optional(),
  },
  async (input) => {
    const agents = await listProjectAgents();
    const filtered = filterAgentsForOrganization(agents, input.organization);
    return jsonText({
      organization: input.organization || "all",
      count: filtered.length,
      agents: filtered,
      usage: "When launching a Subagent for a workroom task, set subagent_type exactly equal to one of these name values. Do not use general-purpose when an assigned agent exists in this roster.",
    });
  },
);

server.tool(
  "assign_task",
  "Assign a task inside a workroom so agents can coordinate without losing context.",
  {
    workroom_id: z.string().min(1),
    title: z.string().min(3),
    assignee_agent: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    due_at: z.string().optional(),
    dependencies: z.array(z.string()).optional(),
    created_by: z.string().optional(),
  },
  async (input) => {
    const dir = await requireWorkroom(input.workroom_id);
    const task = {
      id: `task-${compactTimestamp(nowIso())}-${randomSuffix()}`,
      status: "assigned",
      created_at: nowIso(),
      updated_at: nowIso(),
      title: input.title,
      description: input.description || "",
      assignee_agent: input.assignee_agent,
      priority: input.priority,
      due_at: input.due_at || "",
      dependencies: input.dependencies || [],
      created_by: input.created_by || "unknown",
    };

    await appendEvent(dir, "tasks.jsonl", task);
    await appendAudit(dir, "task_assigned", input.created_by || "unknown", { task });
    await touchWorkroom(dir);

    return jsonText({ task, workroom_id: input.workroom_id });
  },
);

server.tool(
  "update_task_status",
  "Append a task status change. Task history is preserved rather than rewritten.",
  {
    workroom_id: z.string().min(1),
    task_id: z.string().min(1),
    status: z.enum(["assigned", "in_progress", "blocked", "completed", "cancelled"]),
    updated_by: z.string().min(1),
    note: z.string().optional(),
  },
  async (input) => {
    const dir = await requireWorkroom(input.workroom_id);
    const event = {
      id: input.task_id,
      event: "task_status_updated",
      status: input.status,
      updated_at: nowIso(),
      updated_by: input.updated_by,
      note: input.note || "",
    };
    if (input.status === "in_progress") {
      event.started_by = input.updated_by;
      event.started_at = event.updated_at;
    }
    if (input.status === "completed") {
      event.completed_by = input.updated_by;
      event.completed_at = event.updated_at;
    }
    if (input.status === "blocked") {
      event.blocked_by = input.updated_by;
      event.blocked_at = event.updated_at;
    }
    if (input.status === "cancelled") {
      event.cancelled_by = input.updated_by;
      event.cancelled_at = event.updated_at;
    }

    await appendEvent(dir, "tasks.jsonl", event);
    await appendAudit(dir, "task_status_updated", input.updated_by, event);
    await touchWorkroom(dir);

    return jsonText({
      workroom_id: input.workroom_id,
      task_id: input.task_id,
      status: input.status,
      updated_by: input.updated_by,
      completed_by: event.completed_by || null,
      completed_at: event.completed_at || null,
    });
  },
);

server.tool(
  "post_update",
  "Post a status update, blocker, evidence note, or risk note to a workroom.",
  {
    workroom_id: z.string().min(1),
    agent: z.string().min(1),
    message: z.string().min(1),
    kind: z.enum(["status", "note", "evidence", "risk", "blocker"]).default("status"),
    related_task_id: z.string().optional(),
    evidence: z.array(z.string()).optional().describe("Files, URLs, command names, or log refs supporting the update."),
  },
  async (input) => {
    const dir = await requireWorkroom(input.workroom_id);
    const update = {
      id: `update-${compactTimestamp(nowIso())}-${randomSuffix()}`,
      at: nowIso(),
      agent: input.agent,
      kind: input.kind,
      message: input.message,
      related_task_id: input.related_task_id || "",
      evidence: input.evidence || [],
    };

    await appendEvent(dir, "updates.jsonl", update);
    await appendAudit(dir, "update_posted", input.agent, update);
    await touchWorkroom(dir);

    return jsonText({ workroom_id: input.workroom_id, update });
  },
);

server.tool(
  "create_handoff",
  "Create a structured handoff packet before delegating to another subagent.",
  {
    workroom_id: z.string().min(1),
    from_agent: z.string().min(1),
    to_agent: z.string().min(1),
    summary: z.string().min(1),
    context: z.string().min(1),
    requested_output: z.string().min(1),
    files: z.array(z.string()).optional(),
    risks: z.array(z.string()).optional(),
    due_at: z.string().optional(),
  },
  async (input) => {
    const dir = await requireWorkroom(input.workroom_id);
    const handoff = {
      id: `handoff-${compactTimestamp(nowIso())}-${randomSuffix()}`,
      at: nowIso(),
      from_agent: input.from_agent,
      to_agent: input.to_agent,
      summary: input.summary,
      context: input.context,
      requested_output: input.requested_output,
      files: input.files || [],
      risks: input.risks || [],
      due_at: input.due_at || "",
    };
    const handoffPath = path.join(dir, "handoffs", `${handoff.id}.md`);

    await fs.writeFile(handoffPath, renderHandoff(handoff), "utf8");
    await appendEvent(dir, "handoffs.jsonl", { ...handoff, path: relativeRepoPath(handoffPath) });
    await appendAudit(dir, "handoff_created", input.from_agent, handoff);
    await touchWorkroom(dir);

    return jsonText({ workroom_id: input.workroom_id, handoff, path: relativeRepoPath(handoffPath) });
  },
);

server.tool(
  "request_approval",
  "Record a human approval request for actions that need permission or carry risk.",
  {
    workroom_id: z.string().min(1),
    requester_agent: z.string().min(1),
    action: z.string().min(1),
    reason: z.string().min(1),
    risk_level: z.enum(["low", "medium", "high", "critical"]),
    question: z.string().min(1),
    options: z.array(z.string()).optional(),
    needed_by: z.string().optional(),
    blockers: z.array(z.string()).optional(),
  },
  async (input) => {
    const dir = await requireWorkroom(input.workroom_id);
    const approval = {
      id: `approval-${compactTimestamp(nowIso())}-${randomSuffix()}`,
      status: "pending",
      requested_at: nowIso(),
      requester_agent: input.requester_agent,
      action: input.action,
      reason: input.reason,
      risk_level: input.risk_level,
      question: input.question,
      options: input.options || [],
      needed_by: input.needed_by || "",
      blockers: input.blockers || [],
    };

    await appendEvent(dir, "approvals.jsonl", approval);
    await appendAudit(dir, "approval_requested", input.requester_agent, approval);
    await touchWorkroom(dir);

    return jsonText({
      workroom_id: input.workroom_id,
      approval,
      operator_prompt: formatApprovalPrompt(input.workroom_id, approval),
      next_steps: [
        "Send the operator_prompt to the human if approval is needed outside chat.",
        "Use resolve_approval after the human answers.",
        "Use notify_telegram if Telegram env vars are configured.",
        "Use sync_workroom_to_notion if Notion env vars are configured.",
      ],
    });
  },
);

server.tool(
  "resolve_approval",
  "Mark a pending approval request as approved, denied, or withdrawn.",
  {
    workroom_id: z.string().min(1),
    approval_id: z.string().min(1),
    status: z.enum(["approved", "denied", "withdrawn"]),
    resolved_by: z.string().min(1),
    note: z.string().optional(),
  },
  async (input) => {
    const dir = await requireWorkroom(input.workroom_id);
    const approvals = collapseApprovals(await readJsonl(path.join(dir, "approvals.jsonl")));
    const approval = approvals.find((item) => item.id === input.approval_id);
    if (!approval) {
      throw new Error(`Unknown approval_id: ${input.approval_id}`);
    }
    if (approval.status !== "pending") {
      throw new Error(`Approval ${input.approval_id} is already ${approval.status}`);
    }

    const event = {
      id: input.approval_id,
      event: "approval_resolved",
      status: input.status,
      resolved_at: nowIso(),
      resolved_by: input.resolved_by,
      note: input.note || "",
    };

    await appendEvent(dir, "approvals.jsonl", event);
    await appendAudit(dir, "approval_resolved", input.resolved_by, event);
    await appendEvent(dir, "updates.jsonl", {
      id: `update-${compactTimestamp(nowIso())}-${randomSuffix()}`,
      at: nowIso(),
      agent: input.resolved_by,
      kind: "status",
      message: `Approval ${input.approval_id} ${input.status}: ${input.note || "No note."}`,
      related_task_id: "",
      evidence: [],
    });
    await touchWorkroom(dir);

    return jsonText({
      workroom_id: input.workroom_id,
      approval_id: input.approval_id,
      status: input.status,
      operator_prompt: `Approval ${input.approval_id} is ${input.status}. ${input.note || ""}`.trim(),
    });
  },
);

server.tool(
  "record_decision",
  "Record a decision and rationale in both machine-readable and human-readable form.",
  {
    workroom_id: z.string().min(1),
    decision: z.string().min(1),
    made_by: z.string().min(1),
    rationale: z.string().optional(),
    options_considered: z.array(z.string()).optional(),
    impacts: z.array(z.string()).optional(),
    approval_id: z.string().optional(),
  },
  async (input) => {
    const dir = await requireWorkroom(input.workroom_id);
    const decision = {
      id: `decision-${compactTimestamp(nowIso())}-${randomSuffix()}`,
      at: nowIso(),
      decision: input.decision,
      made_by: input.made_by,
      rationale: input.rationale || "",
      options_considered: input.options_considered || [],
      impacts: input.impacts || [],
      approval_id: input.approval_id || "",
    };

    await appendEvent(dir, "decisions.jsonl", decision);
    await fs.appendFile(path.join(dir, "decisions.md"), renderDecision(decision), "utf8");
    await appendAudit(dir, "decision_recorded", input.made_by, decision);
    await touchWorkroom(dir);

    return jsonText({ workroom_id: input.workroom_id, decision });
  },
);

server.tool(
  "notify_telegram",
  "Send a workroom update or approval prompt through Telegram when gateway env vars are configured.",
  {
    message: z.string().min(1),
    workroom_id: z.string().optional(),
    chat_ids: z.array(z.string()).optional().describe("Telegram chat IDs. Defaults to ORG_MCP_TELEGRAM_CHAT_IDS or ORG_MCP_TELEGRAM_CHAT_ID."),
    disable_web_page_preview: z.boolean().default(true),
  },
  async (input) => {
    const token = process.env.ORG_MCP_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const chatIds = input.chat_ids || parseListEnv(process.env.ORG_MCP_TELEGRAM_CHAT_IDS) || parseListEnv(process.env.TELEGRAM_CHAT_IDS) || singleEnvList(process.env.ORG_MCP_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID);

    if (!token || chatIds.length === 0) {
      return jsonText({
        sent: false,
        configured: false,
        setup: [
          "Create one Telegram bot with BotFather.",
          "Set ORG_MCP_TELEGRAM_BOT_TOKEN in the environment that launches Cursor/MCP.",
          "Set ORG_MCP_TELEGRAM_CHAT_ID or ORG_MCP_TELEGRAM_CHAT_IDS after messaging the bot and reading your chat id.",
          "Reload Cursor so the MCP server receives the env vars.",
        ],
      });
    }

    const text = input.workroom_id ? `[${input.workroom_id}]\n\n${input.message}` : input.message;
    const results = [];
    for (const chatId of chatIds) {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: input.disable_web_page_preview,
        }),
      });
      const body = await safeResponseJson(response);
      results.push({
        chat_id: redactChatId(chatId),
        ok: response.ok && body.ok !== false,
        status: response.status,
        description: body.description || "",
        message_id: body.result?.message_id || null,
      });
    }

    if (input.workroom_id) {
      const dir = await requireWorkroom(input.workroom_id);
      await appendAudit(dir, "telegram_notification_sent", "org-mcp", { results });
      await touchWorkroom(dir);
    }

    return jsonText({
      sent: results.every((result) => result.ok),
      configured: true,
      results,
    });
  },
);

server.tool(
  "sync_workroom_to_notion",
  "Create a Notion page snapshot for a workroom when Notion gateway env vars are configured.",
  {
    workroom_id: z.string().min(1),
    title: z.string().optional(),
    parent_page_id: z.string().optional().describe("Defaults to ORG_MCP_NOTION_PARENT_PAGE_ID."),
    database_id: z.string().optional().describe("Defaults to ORG_MCP_NOTION_DATABASE_ID. If set, creates a database page with Name title."),
  },
  async (input) => {
    const token = process.env.ORG_MCP_NOTION_TOKEN || process.env.NOTION_TOKEN;
    const parentPageId = input.parent_page_id || process.env.ORG_MCP_NOTION_PARENT_PAGE_ID;
    const databaseId = input.database_id || process.env.ORG_MCP_NOTION_DATABASE_ID;

    if (!token || (!parentPageId && !databaseId)) {
      return jsonText({
        synced: false,
        configured: false,
        setup: [
          "Create a Notion integration and copy its internal integration secret.",
          "Share the target parent page or database with that integration.",
          "Set ORG_MCP_NOTION_TOKEN in the environment that launches Cursor/MCP.",
          "Set ORG_MCP_NOTION_PARENT_PAGE_ID or ORG_MCP_NOTION_DATABASE_ID.",
          "Reload Cursor so the MCP server receives the env vars.",
        ],
      });
    }

    const dir = await requireWorkroom(input.workroom_id);
    const status = await readWorkroomStatus(dir, 8);
    const title = input.title || `${status.metadata.organization.toUpperCase()}: ${status.metadata.title}`;
    const payload = createNotionPagePayload({
      title,
      parentPageId,
      databaseId,
      status,
    });

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(payload),
    });
    const body = await safeResponseJson(response);

    await appendAudit(dir, "notion_sync_attempted", "org-mcp", {
      ok: response.ok,
      status: response.status,
      page_id: body.id || "",
      url: body.url || "",
      error: body.message || body.code || "",
    });
    await touchWorkroom(dir);

    return jsonText({
      synced: response.ok,
      configured: true,
      status: response.status,
      notion_page_id: body.id || null,
      notion_url: body.url || null,
      error: response.ok ? "" : (body.message || body.code || "Notion request failed"),
    });
  },
);

server.tool(
  "get_status",
  "Read status for one workroom or list open workrooms for an organization.",
  {
    workroom_id: z.string().optional(),
    organization: z.enum(ORGANIZATIONS).optional(),
    include_closed: z.boolean().default(false),
    recent_limit: z.number().int().min(1).max(50).default(10),
  },
  async (input) => {
    await fs.mkdir(workroomsDir, { recursive: true });
    if (input.workroom_id) {
      const dir = await requireWorkroom(input.workroom_id);
      return jsonText(await readWorkroomStatus(dir, input.recent_limit));
    }

    const workrooms = await listWorkroomMetadata({
      organization: input.organization,
      includeClosed: input.include_closed,
    });
    return jsonText({ count: workrooms.length, workrooms });
  },
);

server.tool(
  "close_workroom",
  "Close a workroom with an outcome and optional follow-up phase workroom.",
  {
    workroom_id: z.string().min(1),
    closed_by: z.string().min(1),
    outcome: z.string().min(1),
    remaining_followups: z.array(z.string()).optional(),
    approval_id: z.string().optional(),
    next_phase: z.enum(WORKROOM_PHASES).optional().describe("Create and hand off to this next phase while closing the current workroom."),
    next_phase_title: z.string().optional(),
    next_phase_goal: z.string().optional(),
    final_project: z.boolean().default(false).describe("Set true only when the overall project, not just this phase, is complete."),
  },
  async (input) => {
    const dir = await requireWorkroom(input.workroom_id);
    const metadataPath = path.join(dir, "metadata.json");
    const metadata = await readJson(metadataPath);
    const now = nowIso();
    const inferredNextPhase = input.next_phase || inferNextPhase(metadata, input);
    let followup = null;

    metadata.status = "closed";
    metadata.phase_status = "complete";
    metadata.closed_at = now;
    metadata.updated_at = now;
    metadata.outcome = input.outcome;
    metadata.remaining_followups = input.remaining_followups || [];
    metadata.closed_by = input.closed_by;
    metadata.final_project = input.final_project;
    metadata.next_phase = inferredNextPhase || "";

    await writeJson(metadataPath, metadata);
    await appendEvent(dir, "updates.jsonl", {
      id: `update-${compactTimestamp(now)}-${randomSuffix()}`,
      at: now,
      agent: input.closed_by,
      kind: "status",
      message: `Closed workroom: ${input.outcome}`,
      remaining_followups: input.remaining_followups || [],
      approval_id: input.approval_id || "",
      next_phase: inferredNextPhase || "",
    });
    await appendAudit(dir, "workroom_closed", input.closed_by, {
      outcome: input.outcome,
      remaining_followups: input.remaining_followups || [],
      approval_id: input.approval_id || "",
      next_phase: inferredNextPhase || "",
      final_project: input.final_project,
    });

    if (inferredNextPhase && !input.final_project) {
      const source = await readWorkroomStatus(dir, 10);
      const title = input.next_phase_title || `${metadata.title} - ${titleForPhase(inferredNextPhase)}`;
      const goal = input.next_phase_goal || defaultGoalForPhase(inferredNextPhase, metadata);
      const { workroomId, dir: followupDir, metadata: followupMetadata } = await createWorkroomInternal({
        organization: metadata.organization,
        title,
        goal,
        owner_agent: defaultOwnerForPhase(inferredNextPhase, metadata.organization),
        requester: metadata.requester || input.closed_by,
        context: renderFollowupContext(source, inferredNextPhase),
        tags: [...new Set([...(metadata.tags || []), inferredNextPhase, "follow-up"])],
        phase: inferredNextPhase,
        parent_workroom_id: metadata.id,
        desired_outcome: desiredOutcomeForPhase(inferredNextPhase),
      });
      const tasks = await seedPhaseTasks({
        dir: followupDir,
        phase: inferredNextPhase,
        organization: followupMetadata.organization,
        source,
        createdBy: input.closed_by,
      });
      followup = {
        workroom_id: workroomId,
        phase: inferredNextPhase,
        path: relativeRepoPath(followupDir),
        seeded_tasks: tasks,
      };
      await appendAudit(dir, "followup_workroom_created", input.closed_by, followup);
      await attachChildWorkroom(dir, workroomId, inferredNextPhase);
    }

    return jsonText({
      workroom_id: input.workroom_id,
      status: "closed",
      outcome: input.outcome,
      final_project: input.final_project,
      next_phase: inferredNextPhase || null,
      followup_workroom: followup,
    });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

async function findRepoRoot(startDir) {
  const candidates = [path.resolve(startDir), path.resolve(__dirname, "..", "..")];
  for (const candidate of candidates) {
    const found = await walkUpForRoot(candidate);
    if (found) return found;
  }
  return path.resolve(__dirname, "..", "..");
}

async function walkUpForRoot(startDir) {
  let current = startDir;
  while (true) {
    const checks = await Promise.all(
      ROOT_MARKERS.map(async (marker) => {
        try {
          await fs.access(path.join(current, marker));
          return true;
        } catch {
          return false;
        }
      }),
    );
    if (checks.every(Boolean)) return current;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function getWorkroomDir(workroomId) {
  assertSafeId(workroomId);
  return path.join(workroomsDir, workroomId);
}

async function requireWorkroom(workroomId) {
  const dir = getWorkroomDir(workroomId);
  const metadataPath = path.join(dir, "metadata.json");
  try {
    await fs.access(metadataPath);
  } catch {
    throw new Error(`Unknown workroom_id: ${workroomId}`);
  }
  return dir;
}

async function createWorkroomInternal(input) {
  if (input.parent_workroom_id) assertSafeId(input.parent_workroom_id);
  const now = nowIso();
  const workroomId = `${compactTimestamp(now)}-${input.organization}-${slugify(input.title)}-${randomSuffix()}`;
  const dir = getWorkroomDir(workroomId);
  const metadata = {
    id: workroomId,
    organization: input.organization,
    title: input.title,
    goal: input.goal || "",
    owner_agent: input.owner_agent || "",
    requester: input.requester || "",
    tags: input.tags || [],
    phase: input.phase || "intake",
    phase_status: "active",
    parent_workroom_id: input.parent_workroom_id || "",
    desired_outcome: input.desired_outcome || "",
    status: "open",
    created_at: now,
    updated_at: now,
    closed_at: null,
  };

  await fs.mkdir(path.join(dir, "handoffs"), { recursive: true });
  await writeJson(path.join(dir, "metadata.json"), metadata);
  await fs.writeFile(
    path.join(dir, "brief.md"),
    renderBrief(metadata, input.context || ""),
    "utf8",
  );
  await fs.writeFile(path.join(dir, "decisions.md"), `# Decisions\n\n`, "utf8");
  await appendEvent(dir, "audit.jsonl", {
    event: "workroom_created",
    at: now,
    actor: input.owner_agent || input.requester || "unknown",
    metadata,
  });

  return { workroomId, dir, metadata };
}

async function seedPhaseTasks({ dir, phase, organization, source, createdBy }) {
  const templates = phaseTaskTemplates(phase, organization, source);
  const tasks = [];
  for (const template of templates) {
    const task = {
      id: `task-${compactTimestamp(nowIso())}-${randomSuffix()}`,
      status: "assigned",
      created_at: nowIso(),
      updated_at: nowIso(),
      title: template.title,
      description: template.description,
      assignee_agent: template.assignee_agent,
      priority: template.priority || "normal",
      due_at: "",
      dependencies: template.dependencies || [],
      created_by: createdBy || "org-mcp",
    };
    await appendEvent(dir, "tasks.jsonl", task);
    tasks.push(taskSummary(task));
  }
  await appendAudit(dir, "phase_tasks_seeded", createdBy || "org-mcp", {
    phase,
    tasks,
  });
  await touchWorkroom(dir);
  return tasks;
}

async function attachChildWorkroom(dir, childWorkroomId, phase) {
  const metadataPath = path.join(dir, "metadata.json");
  const metadata = await readJson(metadataPath);
  const children = metadata.child_workrooms || [];
  if (!children.some((child) => child.workroom_id === childWorkroomId)) {
    children.push({
      workroom_id: childWorkroomId,
      phase,
      created_at: nowIso(),
    });
  }
  metadata.child_workrooms = children;
  metadata.updated_at = nowIso();
  await writeJson(metadataPath, metadata);
}

function phaseTaskTemplates(phase, organization, source) {
  if (phase === "implementation") {
    return [
      {
        title: "Implement the approved package",
        assignee_agent: implementationLeadForOrg(organization),
        priority: "high",
        description: `Turn the prior phase output into code changes. Start from source workroom ${source.metadata.id}, read its final package, preserve existing project patterns, and post concrete files/tests changed back to org-mcp.`,
      },
      {
        title: "QA the implementation",
        assignee_agent: qaLeadForOrg(organization),
        priority: "high",
        description: "Verify the implementation against the source workroom goal, run focused checks, inspect edge cases, and record evidence. Do not approve launch if behavior is unverified.",
        dependencies: ["implementation"],
      },
      {
        title: "Prepare launch handoff",
        assignee_agent: launchLeadForOrg(organization),
        priority: "normal",
        description: "Create the launch/readiness notes, rollback considerations, and approval gates for deployment or client delivery once QA evidence exists.",
        dependencies: ["qa"],
      },
    ];
  }

  if (phase === "qa") {
    return [
      {
        title: "Run independent QA pass",
        assignee_agent: qaLeadForOrg(organization),
        priority: "high",
        description: `Verify work from source workroom ${source.metadata.id}, capture evidence, and block on any material defect.`,
      },
      {
        title: "Prepare launch recommendation",
        assignee_agent: launchLeadForOrg(organization),
        priority: "normal",
        description: "Summarize go/no-go, risks, rollback notes, and required approvals.",
      },
    ];
  }

  if (phase === "launch") {
    return [
      {
        title: "Run launch readiness",
        assignee_agent: launchLeadForOrg(organization),
        priority: "high",
        description: `Prepare and execute approved release/client handoff steps from source workroom ${source.metadata.id}. Request approval before deploys, external commitments, or irreversible actions.`,
      },
      {
        title: "Review operational risk",
        assignee_agent: riskLeadForOrg(organization),
        priority: "high",
        description: "Check approval gates, rollback path, secrets/safety exposure, and production/client risk before launch.",
      },
    ];
  }

  return [
    {
      title: `Advance ${phase} phase`,
      assignee_agent: defaultOwnerForPhase(phase, organization),
      priority: "normal",
      description: `Advance the ${phase} work from source workroom ${source.metadata.id} and post evidence back to org-mcp.`,
    },
  ];
}

function inferNextPhase(metadata, input) {
  if (input.next_phase) return input.next_phase;
  if (input.final_project) return null;

  const text = [
    metadata.goal,
    metadata.desired_outcome,
    input.outcome,
    ...(input.remaining_followups || []),
  ].join(" ").toLowerCase();

  const phase = metadata.phase || "intake";
  if (["intake", "strategy", "research", "design"].includes(phase) && /\b(build|implement|code|ship|deploy|launch|production|ready for build|ready-to-build)\b/.test(text)) {
    return "implementation";
  }
  if (phase === "implementation" && /\b(qa|test|verify|validation|ready for qa|ready-to-qa)\b/.test(text)) {
    return "qa";
  }
  if (phase === "qa" && /\b(launch|deploy|ship|release|client handoff|go live|go-live)\b/.test(text)) {
    return "launch";
  }
  return null;
}

function titleForPhase(phase) {
  const titles = {
    intake: "Intake",
    strategy: "Strategy",
    research: "Research",
    design: "Design",
    implementation: "Implementation",
    qa: "QA",
    launch: "Launch",
    ops: "Operations",
  };
  return titles[phase] || phase;
}

function defaultGoalForPhase(phase, sourceMetadata) {
  if (phase === "implementation") {
    return `Build the approved ${sourceMetadata.phase || "prior"} output from ${sourceMetadata.id} into working code, then hand off to QA and launch readiness.`;
  }
  if (phase === "qa") {
    return `Verify the implementation from ${sourceMetadata.id}, record evidence, and produce a go/no-go recommendation.`;
  }
  if (phase === "launch") {
    return `Prepare approved release/client handoff for ${sourceMetadata.id} with rollback and approval gates.`;
  }
  return `Continue ${sourceMetadata.title} into the ${phase} phase.`;
}

function renderFollowupContext(source, phase) {
  const recentUpdates = (source.recent_updates || [])
    .slice(-5)
    .map((update) => `- ${update.kind || "update"} by ${update.agent || "unknown"}: ${update.message || ""}`)
    .join("\n");
  const completedTasks = (source.completed_tasks || [])
    .map((task) => `- ${task.title || task.id} completed by ${task.completed_by || "unknown"}`)
    .join("\n");

  return `This is the ${phase} follow-up for source workroom ${source.metadata.id}.

Source title: ${source.metadata.title}
Source phase: ${source.metadata.phase || "unknown"}
Source outcome: ${source.metadata.outcome || "not closed yet"}
Source path: ${source.path}

Completed source tasks:
${completedTasks || "- None recorded."}

Recent source updates:
${recentUpdates || "- None recorded."}

Read the source workroom files before acting, especially any final package or handoff artifacts.`;
}

function desiredOutcomeForPhase(phase) {
  if (phase === "implementation") return "working-code";
  if (phase === "qa") return "verified-release-candidate";
  if (phase === "launch") return "approved-launch-or-client-handoff";
  return phase;
}

function defaultOwnerForPhase(phase, organization) {
  if (phase === "implementation") return implementationLeadForOrg(organization);
  if (phase === "qa") return qaLeadForOrg(organization);
  if (phase === "launch") return launchLeadForOrg(organization);
  if (organization === "dblvsn") return "dblvsn";
  return "the-agentsy";
}

function implementationLeadForOrg(organization) {
  return "agentsy-implementation-lead";
}

function qaLeadForOrg(organization) {
  return "agentsy-qa-director";
}

function launchLeadForOrg(organization) {
  return "agentsy-launch-producer";
}

function riskLeadForOrg(organization) {
  return "agentsy-risk-officer";
}

async function listProjectAgents() {
  const agents = [];
  try {
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const filePath = path.join(agentsDir, entry.name);
      const text = await fs.readFile(filePath, "utf8");
      const name = text.match(/^name:\s*([^\n\r]+)/m)?.[1]?.trim() || entry.name.replace(/\.md$/, "");
      const description = text.match(/^description:\s*([^\n\r]+)/m)?.[1]?.trim() || "";
      agents.push({
        name,
        description,
        file: relativeRepoPath(filePath),
      });
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

function filterAgentsForOrganization(agents, organization) {
  if (organization === "dblvsn") {
    return agents.filter((agent) => (
      agent.name.startsWith("dblvsn") ||
      agent.name.startsWith("agentsy") ||
      agent.name === "the-agentsy" ||
      agent.name === "artiste"
    ));
  }
  if (organization === "agentsy") {
    return agents.filter((agent) => agent.name.startsWith("agentsy") || agent.name === "the-agentsy" || agent.name === "artiste" || agent.name === "dblvsn-cco");
  }
  return agents;
}

async function readWorkroomStatus(dir, recentLimit) {
  const metadata = await readJson(path.join(dir, "metadata.json"));
  const taskEvents = await readJsonl(path.join(dir, "tasks.jsonl"));
  const approvals = collapseApprovals(await readJsonl(path.join(dir, "approvals.jsonl")));
  const updates = await readJsonl(path.join(dir, "updates.jsonl"));
  const decisions = await readJsonl(path.join(dir, "decisions.jsonl"));
  const handoffs = await readJsonl(path.join(dir, "handoffs.jsonl"));

  const tasks = collapseTaskEvents(taskEvents);
  const agentActivity = buildAgentActivity({
    tasks,
    updates,
    decisions,
    handoffs,
    approvals,
  });

  return {
    metadata,
    path: relativeRepoPath(dir),
    tasks,
    completed_tasks: tasks.filter((task) => task.status === "completed").map(taskSummary),
    task_activity: tasks.map(taskSummary),
    agent_activity: agentActivity,
    pending_approvals: approvals.filter((approval) => approval.status === "pending"),
    approvals,
    recent_updates: updates.slice(-recentLimit),
    recent_handoffs: handoffs.slice(-recentLimit),
    recent_decisions: decisions.slice(-recentLimit),
  };
}

async function listWorkroomMetadata(filters = {}) {
  await fs.mkdir(workroomsDir, { recursive: true });
  const entries = await fs.readdir(workroomsDir, { withFileTypes: true });
  const workrooms = [];
  const query = filters.query?.toLowerCase().trim();
  const tags = filters.tags || [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(workroomsDir, entry.name);
    const metadata = await readJsonIfExists(path.join(dir, "metadata.json"));
    if (!metadata) continue;
    if (filters.organization && metadata.organization !== filters.organization) continue;
    if (filters.ownerAgent && metadata.owner_agent !== filters.ownerAgent) continue;
    if (!filters.includeClosed && metadata.status === "closed") continue;
    if (tags.length > 0 && !tags.every((tag) => (metadata.tags || []).includes(tag))) continue;
    if (query && !workroomMatchesQuery(metadata, query)) continue;

    workrooms.push({
      id: metadata.id,
      organization: metadata.organization,
      title: metadata.title,
      goal: metadata.goal,
      owner_agent: metadata.owner_agent,
      requester: metadata.requester,
      tags: metadata.tags || [],
      phase: metadata.phase || "intake",
      parent_workroom_id: metadata.parent_workroom_id || "",
      desired_outcome: metadata.desired_outcome || "",
      status: metadata.status,
      updated_at: metadata.updated_at,
      path: relativeRepoPath(dir),
    });
  }

  workrooms.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  return workrooms;
}

async function buildCompanyStatus(input) {
  const metadata = await listWorkroomMetadata({
    organization: input.organization,
    includeClosed: input.include_closed,
  });
  const workrooms = [];

  for (const item of metadata) {
    const status = await readWorkroomStatus(getWorkroomDir(item.id), input.recent_limit);
    const openTasks = status.tasks.filter((task) => ["assigned", "in_progress"].includes(task.status));
    const completedTasks = status.tasks.filter((task) => task.status === "completed");
    const blockedTasks = status.tasks.filter((task) => task.status === "blocked");
    const blockers = status.recent_updates.filter((update) => update.kind === "blocker");
    const risks = status.recent_updates.filter((update) => update.kind === "risk");

    workrooms.push({
      id: status.metadata.id,
      organization: status.metadata.organization,
      title: status.metadata.title,
      goal: status.metadata.goal,
      owner_agent: status.metadata.owner_agent || "unassigned",
      phase: status.metadata.phase || "intake",
      parent_workroom_id: status.metadata.parent_workroom_id || "",
      desired_outcome: status.metadata.desired_outcome || "",
      status: status.metadata.status,
      updated_at: status.metadata.updated_at,
      path: status.path,
      open_tasks: openTasks.map(taskSummary),
      completed_tasks: completedTasks.map(taskSummary),
      blocked_tasks: blockedTasks.map(taskSummary),
      agent_activity: status.agent_activity,
      pending_approvals: status.pending_approvals.map(approvalSummary),
      blockers: blockers.map(updateSummary),
      risks: risks.map(updateSummary),
      recent_updates: status.recent_updates.map(updateSummary),
      next_actions: deriveNextActions(status, openTasks, blockedTasks, blockers),
    });
  }

  return workrooms;
}

function deriveNextActions(status, openTasks, blockedTasks, blockers) {
  const actions = [];
  if (status.pending_approvals.length > 0) {
    actions.push(`Resolve ${status.pending_approvals.length} pending approval request(s).`);
  }
  if (blockedTasks.length > 0 || blockers.length > 0) {
    actions.push(`Clear ${blockedTasks.length + blockers.length} blocker(s).`);
  }
  if (openTasks.length > 0) {
    actions.push(`Advance ${openTasks.length} open task(s).`);
  }
  if (actions.length === 0 && status.metadata.status !== "closed") {
    actions.push("Post the next status update or close the workroom if complete.");
  }
  return actions;
}

function taskSummary(task) {
  return {
    id: task.id,
    title: task.title || "",
    assignee_agent: task.assignee_agent || "",
    status: task.status || "",
    priority: task.priority || "normal",
    created_by: task.created_by || "",
    started_by: task.started_by || "",
    started_at: task.started_at || "",
    last_updated_by: task.updated_by || task.created_by || "",
    updated_at: task.updated_at || task.created_at || "",
    completed_by: task.completed_by || "",
    completed_at: task.completed_at || "",
    blocked_by: task.blocked_by || "",
    blocked_at: task.blocked_at || "",
    note: task.note || "",
  };
}

function buildAgentActivity({ tasks, updates, decisions, handoffs, approvals }) {
  const agents = new Map();

  for (const task of tasks) {
    bumpAgent(agents, task.assignee_agent, "assigned_tasks");
    bumpAgent(agents, task.created_by, "created_tasks");
    bumpAgent(agents, task.updated_by, "task_updates");
    bumpAgent(agents, task.completed_by, "completed_tasks");
    bumpAgent(agents, task.started_by, "started_tasks");
    bumpAgent(agents, task.blocked_by, "blocked_tasks");
  }
  for (const update of updates) {
    bumpAgent(agents, update.agent, "posted_updates");
  }
  for (const decision of decisions) {
    bumpAgent(agents, decision.made_by, "decisions");
  }
  for (const handoff of handoffs) {
    bumpAgent(agents, handoff.from_agent, "handoffs_sent");
    bumpAgent(agents, handoff.to_agent, "handoffs_received");
  }
  for (const approval of approvals) {
    bumpAgent(agents, approval.requester_agent, "approval_requests");
    bumpAgent(agents, approval.resolved_by, "approvals_resolved");
  }

  return [...agents.values()].sort((a, b) => {
    const bTotal = Object.entries(b).filter(([key]) => key !== "agent").reduce((sum, [, value]) => sum + value, 0);
    const aTotal = Object.entries(a).filter(([key]) => key !== "agent").reduce((sum, [, value]) => sum + value, 0);
    return bTotal - aTotal || a.agent.localeCompare(b.agent);
  });
}

function bumpAgent(agents, agent, field) {
  if (!agent) return;
  const current = agents.get(agent) || {
    agent,
    assigned_tasks: 0,
    created_tasks: 0,
    started_tasks: 0,
    task_updates: 0,
    completed_tasks: 0,
    blocked_tasks: 0,
    posted_updates: 0,
    decisions: 0,
    handoffs_sent: 0,
    handoffs_received: 0,
    approval_requests: 0,
    approvals_resolved: 0,
  };
  current[field] += 1;
  agents.set(agent, current);
}

function approvalSummary(approval) {
  return {
    id: approval.id,
    action: approval.action || "",
    requester_agent: approval.requester_agent || "",
    risk_level: approval.risk_level || "",
    status: approval.status || "",
    question: approval.question || "",
    requested_at: approval.requested_at || "",
    needed_by: approval.needed_by || "",
  };
}

function updateSummary(update) {
  return {
    id: update.id,
    at: update.at || "",
    agent: update.agent || "",
    kind: update.kind || "",
    message: update.message || "",
    evidence: update.evidence || [],
  };
}

function formatApprovalPrompt(workroomId, approval) {
  const options = approval.options.length > 0
    ? approval.options.map((option) => `- ${option}`).join("\n")
    : "- approved\n- denied\n- withdrawn";
  const blockers = approval.blockers.length > 0
    ? approval.blockers.map((blocker) => `- ${blocker}`).join("\n")
    : "- None recorded.";

  return `Approval needed

Workroom: ${workroomId}
Approval ID: ${approval.id}
Requester: ${approval.requester_agent}
Risk: ${approval.risk_level}
Action: ${approval.action}

Reason:
${approval.reason}

Question:
${approval.question}

Options:
${options}

Blockers:
${blockers}

After the human answers, call resolve_approval with status approved, denied, or withdrawn.`;
}

function createNotionPagePayload({ title, parentPageId, databaseId, status }) {
  const parent = databaseId ? { database_id: databaseId } : { page_id: parentPageId };
  const properties = databaseId
    ? { Name: { title: notionRichText(title) } }
    : { title: notionRichText(title) };

  return {
    parent,
    properties,
    children: [
      notionHeading("Workroom"),
      notionBullets([
        `ID: ${status.metadata.id}`,
        `Organization: ${status.metadata.organization}`,
        `Status: ${status.metadata.status}`,
        `Phase: ${status.metadata.phase || "intake"}`,
        `Desired outcome: ${status.metadata.desired_outcome || "not recorded"}`,
        `Owner: ${status.metadata.owner_agent || "unassigned"}`,
        `Updated: ${status.metadata.updated_at}`,
        `Path: ${status.path}`,
      ]),
      notionHeading("Goal"),
      notionParagraph(status.metadata.goal || "No goal recorded."),
      notionHeading("Open Tasks"),
      notionBullets(status.tasks.filter((task) => ["assigned", "in_progress", "blocked"].includes(task.status)).map((task) => `${task.status}: ${task.title || task.id} (${task.assignee_agent || "unassigned"})`)),
      notionHeading("Completed Tasks"),
      notionBullets(status.completed_tasks.map((task) => `${task.title || task.id} - completed by ${task.completed_by || "unknown"} at ${task.completed_at || "unknown time"}`)),
      notionHeading("Agent Activity"),
      notionBullets(status.agent_activity.map((activity) => `${activity.agent}: ${activity.completed_tasks} completed, ${activity.task_updates} task updates, ${activity.posted_updates} updates, ${activity.decisions} decisions`)),
      notionHeading("Pending Approvals"),
      notionBullets(status.pending_approvals.map((approval) => `${approval.risk_level || "risk"}: ${approval.action || approval.id} - ${approval.question || ""}`)),
      notionHeading("Recent Updates"),
      notionBullets(status.recent_updates.map((update) => `${update.kind || "update"} from ${update.agent || "unknown"}: ${update.message || ""}`)),
      notionHeading("Recent Decisions"),
      notionBullets(status.recent_decisions.map((decision) => `${decision.decision || decision.id} (${decision.made_by || "unknown"})`)),
    ].flat().slice(0, 100),
  };
}

function notionHeading(text) {
  return {
    object: "block",
    type: "heading_2",
    heading_2: { rich_text: notionRichText(text) },
  };
}

function notionParagraph(text) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: notionRichText(text) },
  };
}

function notionBullets(values) {
  if (!values || values.length === 0) {
    return [notionBullet("None recorded.")];
  }
  return values.slice(0, 25).map((value) => notionBullet(value));
}

function notionBullet(text) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: notionRichText(String(text).slice(0, 1900)) },
  };
}

function notionRichText(text) {
  return [
    {
      type: "text",
      text: { content: String(text).slice(0, 1900) },
    },
  ];
}

async function safeResponseJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function parseListEnv(value) {
  if (!value) return null;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function singleEnvList(value) {
  return value ? [value] : [];
}

function redactChatId(chatId) {
  const value = String(chatId);
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function workroomMatchesQuery(metadata, query) {
  const haystack = [
    metadata.id,
    metadata.title,
    metadata.goal,
    metadata.phase,
    metadata.desired_outcome,
    metadata.parent_workroom_id,
    metadata.owner_agent,
    metadata.requester,
    ...(metadata.tags || []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function collapseTaskEvents(events) {
  const byId = new Map();
  for (const event of events) {
    if (!event.id) continue;
    const current = byId.get(event.id) || {};
    byId.set(event.id, {
      ...current,
      ...event,
      history: [...(current.history || []), event],
    });
  }
  return [...byId.values()].sort((a, b) => String(a.created_at || a.updated_at).localeCompare(String(b.created_at || b.updated_at)));
}

function collapseApprovals(events) {
  const byId = new Map();
  for (const event of events) {
    if (!event.id) continue;
    const current = byId.get(event.id) || {};
    byId.set(event.id, {
      ...current,
      ...event,
      history: [...(current.history || []), event],
    });
  }
  return [...byId.values()].sort((a, b) => String(a.requested_at || a.resolved_at).localeCompare(String(b.requested_at || b.resolved_at)));
}

async function touchWorkroom(dir) {
  const metadataPath = path.join(dir, "metadata.json");
  const metadata = await readJson(metadataPath);
  metadata.updated_at = nowIso();
  await writeJson(metadataPath, metadata);
}

async function appendAudit(dir, event, actor, details) {
  await appendEvent(dir, "audit.jsonl", {
    event,
    at: nowIso(),
    actor,
    details,
  });
}

async function appendEvent(dir, fileName, event) {
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(path.join(dir, fileName), `${JSON.stringify(event)}\n`, "utf8");
}

async function readJson(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text);
}

async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function readJsonl(filePath) {
  let text = "";
  try {
    text = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const records = [];
  for (const [index, line] of text.split("\n").entries()) {
    if (!line) continue;
    try {
      records.push(JSON.parse(line));
    } catch (error) {
      records.push({
        id: `invalid-json-line-${index + 1}`,
        event: "invalid_json_line",
        parse_error: error.message,
        raw_line: line.slice(0, 500),
      });
    }
  }
  return records;
}

function renderBrief(metadata, context) {
  return `# ${metadata.title}

- Workroom ID: \`${metadata.id}\`
- Organization: \`${metadata.organization}\`
- Status: \`${metadata.status}\`
- Phase: \`${metadata.phase || "intake"}\`
- Desired Outcome: \`${metadata.desired_outcome || "not recorded"}\`
- Parent Workroom: \`${metadata.parent_workroom_id || "none"}\`
- Owner Agent: \`${metadata.owner_agent || "unassigned"}\`
- Requester: \`${metadata.requester || "unknown"}\`
- Created: \`${metadata.created_at}\`

## Goal

${metadata.goal || "TBD"}

## Context

${context || "No additional context yet."}

## Agent Operating Notes

- Post meaningful discoveries with \`post_update\`.
- Create a \`create_handoff\` packet before delegating to another subagent.
- Record high-impact or directional choices with \`record_decision\`.
- Use \`request_approval\` before external, destructive, spending, deployment, secrets, or live-trading actions.
`;
}

function renderHandoff(handoff) {
  return `# Handoff: ${handoff.from_agent} -> ${handoff.to_agent}

- Handoff ID: \`${handoff.id}\`
- Created: \`${handoff.at}\`
- Due: \`${handoff.due_at || "not specified"}\`

## Summary

${handoff.summary}

## Context

${handoff.context}

## Requested Output

${handoff.requested_output}

## Files

${renderList(handoff.files)}

## Risks

${renderList(handoff.risks)}
`;
}

function renderDecision(decision) {
  return `## ${decision.decision}

- Decision ID: \`${decision.id}\`
- Made by: \`${decision.made_by}\`
- At: \`${decision.at}\`
- Approval ID: \`${decision.approval_id || "none"}\`

### Rationale

${decision.rationale || "No rationale recorded."}

### Options Considered

${renderList(decision.options_considered)}

### Impacts

${renderList(decision.impacts)}

`;
}

function renderList(values) {
  if (!values || values.length === 0) return "- None recorded.";
  return values.map((value) => `- ${value}`).join("\n");
}

function jsonText(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function relativeRepoPath(filePath) {
  return path.relative(rootDir, filePath) || ".";
}

function nowIso() {
  return new Date().toISOString();
}

function compactTimestamp(iso) {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "workroom";
}

function assertSafeId(value) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value)) {
    throw new Error(`Unsafe identifier: ${value}`);
  }
}
