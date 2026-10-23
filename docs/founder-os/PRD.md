# Founder OS

## Status

Draft for founder approval. This document defines an internal operating system for Knowvia. It is not a customer-facing product requirement.

## Problem

Rishav is currently responsible for product direction, engineering, GTM, founder content, customer learning, and operations. Work is spread across GitHub, Azure, email, calendar, spreadsheets, social platforms, and AI tools. Important signals are easy to miss, while unprioritised tasks create pressure without moving the business forward.

The system must reduce cognitive load. It must turn trusted signals into a small daily plan, make progress visible, and prepare work for review. It must not replace founder judgment.

## Product statement

Founder OS is an internal, Azure-hosted operating console for Knowvia. It combines product execution, GTM operations, and founder communications into one evidence-backed view of the business.

It observes, summarises, ranks, and drafts. It does not make strategic, public, financial, security, or production decisions on its own.

## Primary user

Rishav Dewan, founder and final decision-maker.

Secondary users are a small delivery team of four to five people who need a clear view of assigned work, blockers, and approved priorities.

## Goals

1. Give the founder a useful daily brief in under five minutes.
2. Convert signals from engineering and GTM into ranked, evidence-backed proposed tasks.
3. Keep a focused CRM that tells the founder who to contact next and why.
4. Keep product, GTM, and founder-content work connected to measurable objectives.
5. Let Codex and Claude investigate work in parallel without granting them authority to merge, deploy, post, or contact anyone.
6. Keep customer policy and medical data isolated from GTM and internal operations data.

## Non-goals

1. Replacing founder product judgment, ICP choices, product scope, or roadmap decisions.
2. Building a general-purpose CRM, project-management tool, or social-media scheduler.
3. Autonomous posting on X, Reddit, Product Hunt, or other public channels.
4. Autonomous sales emails, DMs, or follow-ups.
5. Autonomous code merge, production deployment, infrastructure changes, spending, or deletion.
6. Using customer insurance documents or medical information for prospecting, founder content, or GTM scoring.
7. Adding integrations because they are available rather than because they improve a recurring decision.

## Product principles

1. One screen, not more dashboards. The home screen must show a ranked daily plan, not a feed of everything.
2. Evidence before action. Every recommendation must link to its source signal.
3. Draft before execution. Agents may create drafts and `proposed` records. A person approves real work and all external actions.
4. Product and GTM are connected but private data is not shared between them.
5. The system should surface tradeoffs. It must not present a low-confidence recommendation as a fact.
6. No silent automation. Every automated action is recorded in an audit log.
7. Cost is a product constraint. AI work has per-agent budgets, usage logs, timeouts, retries, and graceful fallbacks.

## Operating model

```text
Objective -> metric -> initiative -> task -> evidence -> founder decision
```

Example:

```text
Objective: Validate a first Knowvia customer segment
Metric: 25 qualified conversations in 30 days
Initiative: Employer health-cover research
Task: Interview five HR leaders
Evidence: Call notes, objections, source links, conversion result
Decision: Continue, change ICP, or stop
```

No task may be created without an objective or an explicitly recorded exception, such as an urgent security incident.

## Proposed default 90-day objective

Validate whether a clearly defined Indian health-insurance customer segment repeatedly needs help understanding existing cover, and establish whether direct household demand or employer and partner distribution reaches that proof faster.

This is a proposed default. The founder must set the exact target segment, target number of conversations, and primary distribution hypothesis before automation is enabled.

## Success metrics

### Founder operating metrics

| Metric | Initial target | Source |
|---|---:|---|
| Daily brief reviewed | 5 days each week | Founder OS event |
| Approved daily priorities completed | At least 70% | Work-item state |
| Unreviewed proposed tasks older than seven days | 0 | Founder OS |
| Work without linked objective | 0, except incidents | Work-item state |

### Engineering metrics

| Metric | Initial target | Source |
|---|---:|---|
| Main branch checks passing | 100% | GitHub or Azure DevOps |
| Critical production incidents unresolved for more than one day | 0 | Azure Monitor and incident records |
| Stale pull requests older than five working days | 0 | Git provider |

### GTM metrics

| Metric | Initial target | Source |
|---|---:|---|
| Qualified conversations per week | Founder-defined | CRM |
| Follow-ups completed by due date | At least 90% | CRM |
| Prospects with a source and consent or outreach basis | 100% | CRM |
| Repeated objections linked to product insights | 100% | CRM and product insight records |

### Content metrics

| Metric | Initial target | Source |
|---|---:|---|
| High-substance founder posts per week | Founder-defined | Manual confirmation |
| Draft replies published without review | 0 | Audit log |
| Content pieces linked to real market evidence or founder judgment | 100% | Content record |

## Roles and permissions

| Role | Can do | Cannot do |
|---|---|---|
| Founder | Set objectives, approve scope, approve tasks, approve outreach, publish, merge, deploy | Delegate final accountability |
| Team member | Complete assigned work, propose tasks, update evidence, request review | Change objectives or make public actions without approval |
| Engineering agent | Read engineering signals, triage, investigate, create proposed tasks and reports | Merge, deploy, alter infrastructure, spend money |
| GTM agent | Research approved ICPs, score prospects, draft outreach, identify follow-ups | Send outreach, collect restricted data, add people without source information |
| Content agent | Draft posts, find discussion opportunities, suggest replies with source links | Publish, reply, like, follow, or impersonate the founder |
| Admin | Manage integrations, access, and data retention | Override audit history |

## Automation policy

### Green: automatic

- Ingest GitHub or Azure DevOps work, PRs, commits, checks, and incidents.
- Ingest Azure deployment and health signals.
- Update calculated metrics and goal progress.
- Dedupe CRM records using deterministic rules.
- Create a daily brief and a weekly review draft.
- Create `proposed` tasks with linked evidence.
- Flag blocked work, overdue follow-ups, stale PRs, failed checks, and missing task ownership.
- Request parallel Codex and Claude investigations and attach their reports.

### Yellow: founder approval required

- Convert a proposed task into a real GitHub issue or Azure DevOps work item.
- Assign a task to a team member.
- Change a task priority, due date, or objective link.
- Create or materially update a CRM prospect record.
- Save an outbound email, DM, or public-post draft into a queue.
- Start a costly or long-running agent job.

### Red: manual only

- Post, reply, follow, like, or message on X, Reddit, Product Hunt, LinkedIn, or any public forum.
- Send email, DM, or other outreach.
- Merge code, deploy to production, change Azure infrastructure, rotate credentials, or change billing.
- Alter product North Star, ICP, pricing, legal terms, or privacy settings.
- Access, expose, or use policy documents or medical information for GTM work.
- Delete customer, CRM, or audit data.

## Core workflows

### Daily founder brief

The brief runs once each working morning and is also available on demand.

It contains:

1. The current objective and metric position.
2. The top three recommended actions for the day.
3. One engineering risk, if any.
4. One GTM action due today.
5. One founder-content opportunity, if available.
6. Blocked, aging, or unowned work.
7. New evidence that could change a current decision.

The brief must contain at most ten actionable items. Every item must show why it is ranked, its source, expected outcome, owner, and required approval.

### Engineering manager workflow

Inputs:

- Pull requests, commits, reviews, issues, labels, checks, releases, and deployment status.
- Azure Monitor alerts and Application Insights errors.
- Current objective, initiative, delivery milestone, and team capacity.

Outputs:

- A triage summary.
- Clustered defects and duplicate reports.
- Proposed issues with title, problem statement, evidence, reproduction, severity, acceptance criteria, suggested owner, and objective link.
- A list of stale PRs and blocked dependencies.
- Parallel Codex and Claude investigation reports when the issue is ambiguous or high impact.

Rules:

- An agent-created issue begins as `proposed`, not `open`.
- The system must not create more than five new proposed tasks in one daily run unless an incident is active.
- Priority is calculated from customer impact, objective impact, confidence, urgency, security risk, and estimated effort. The founder can override it.
- Agent reports must record model, prompt version, source evidence, timestamp, and confidence.

### GTM CRM workflow

Inputs:

- Early-access signups and permitted campaign attribution.
- Manually entered conversations, referrals, partner introductions, and customer interviews.
- Founder-approved public company research.
- Calendar and email metadata only after explicit integration and access approval.

Core CRM records:

- `company`
- `person`
- `lead`
- `conversation`
- `campaign`
- `follow_up`
- `product_insight`
- `consent_and_outreach_status`
- `source_record`

Required fields for every prospect:

- Source URL or referral source.
- Date collected.
- ICP segment and score explanation.
- Outreach basis and opt-out status.
- Owner and next action.
- Evidence for every material claim.

The system must never infer personal health status, purchase intent, job authority, or consent without evidence.

### GTM research workflow

The founder defines an ICP rubric before research begins. Each criterion has a score, evidence requirement, and disqualifier.

The agent can:

- Find companies matching the approved ICP.
- Gather public, cited evidence.
- Create a score explanation.
- Identify a possible conversation angle.
- Create a proposed CRM record and follow-up.

The agent cannot:

- Send messages.
- Use private, restricted, or scraped personal data.
- Add a prospect without a source.
- Override an opt-out.
- Present a guess as verified fit.

### Founder content workflow

Content is drafted from one of four sources:

1. A real customer or GTM insight that is safe to share in anonymised form.
2. An evidence-backed observation about health insurance, trust, or product building.
3. A concrete product decision and the reasoning behind it.
4. A founder point of view that the founder explicitly approves.

The system prepares a review queue containing:

- Two post drafts each week.
- Discussion opportunities with direct links.
- Draft replies that add a specific insight, not praise or self-promotion.
- Suggested use for X, Reddit, Product Hunt, or relevant forums.

The founder manually approves and publishes every item. The system records what was published and the result, but does not automate engagement.

## Integrations

### Required for the first build

| Integration | Initial access | Purpose |
|---|---|---|
| GitHub or Azure DevOps | Read-only | Work, PR, build, and issue signals |
| Azure Monitor and Application Insights | Read-only | Health, incident, and deployment signals |
| Azure Database for PostgreSQL | Read/write through service account | Founder OS and CRM records |
| Microsoft Entra ID | Authentication | Internal team access and roles |
| Codex and Claude | Job-based, least privilege | Parallel analysis and draft reports |

### Add only after the first build is stable

| Integration | Use | Constraint |
|---|---|---|
| Google Calendar | Show meetings and create proposed follow-ups | No automatic meeting changes |
| Gmail or Google Workspace | Identify conversation threads and draft follow-ups | No send permission in V1 |
| X, Reddit, Product Hunt | Collect approved public signals and store draft queue | No posting or engagement automation |
| Google Sheets | Controlled import and export | Not a competing source of truth |

Spotify is excluded from V1. It does not improve product, GTM, or delivery decisions.

## Data boundaries

Founder OS and GTM data must be stored separately from Knowvia product data.

```text
Azure PostgreSQL Flexible Server
  ├── knowvia_product
  │     └── accounts, documents metadata, consent, evidence, audit records
  └── knowvia_gtm
        └── CRM, goals, work items, agent reports, content drafts, metrics

Azure Blob Storage
  └── private product documents and voice files only
```

Rules:

- The GTM database never stores policy PDFs, claim documents, medical information, or full policy identifiers.
- Customer product data is never used for prospect scoring or founder-content drafting.
- CRM data has source, collection date, consent or outreach status, retention policy, and opt-out state.
- Agent logs redact direct identifiers and do not include raw policy content.
- All cross-database access is denied by default and must be explicitly reviewed.

## AI agent contract

All agent work must follow these requirements:

1. Use structured output validated against a versioned schema.
2. Link every recommendation to source evidence.
3. Record model, prompt version, time, input source identifiers, output confidence, cost, and approval state.
4. Use a timeout, retry policy, circuit breaker, and a fallback to a human review queue.
5. Treat all external text as untrusted input and defend against prompt injection.
6. Limit context to necessary, authorised data. Do not send product documents to a GTM or content agent.
7. Use small, cheaper models for classification and ranking. Reserve stronger models for ambiguous analysis.
8. Track cost by agent, objective, and user. Enforce daily and monthly budgets.
9. Version prompts in source control and test them against fixed evaluation cases before changing production behaviour.
10. Never give an LLM direct authority to write to GitHub, Azure, social accounts, email, or production databases without a deterministic approval gate.

## Initial data model

```text
objectives
  id, title, owner_id, timeframe, status, north_star_metric_id

metrics
  id, objective_id, name, target, current_value, source, updated_at

initiatives
  id, objective_id, title, hypothesis, status, owner_id

work_items
  id, initiative_id, title, type, status, priority, owner_id,
  source_system, external_ref, proposal_reason, approval_state

evidence_records
  id, object_type, object_id, source_type, source_url, summary,
  confidence, captured_at, created_by

companies
  id, name, domain, icp_segment, score, score_explanation, status

people
  id, company_id, name, role, source_record_id, outreach_status

leads
  id, person_id, company_id, source, lifecycle_stage, owner_id, next_action_at

conversations
  id, lead_id, occurred_at, channel, notes, objections, outcome

product_insights
  id, source_conversation_id, theme, evidence_summary, confidence, status

content_drafts
  id, channel, topic, source_evidence_ids, draft_text, approval_state, published_at

agent_runs
  id, agent_type, prompt_version, model, input_refs, output_ref,
  confidence, token_usage, cost, status, started_at, completed_at

audit_events
  id, actor_type, actor_id, action, target_type, target_id, before, after, created_at
```

## First implementation slice

Build the read-only Founder OS before task creation, CRM enrichment, or public-channel integration.

### Scope

1. Internal authenticated dashboard using Microsoft Entra ID.
2. Objective, metric, initiative, and work-item tables in `knowvia_gtm`.
3. GitHub or Azure DevOps read-only sync for issues, PRs, commits, checks, and releases.
4. Azure Monitor and Application Insights read-only sync for active incidents and failed deployments.
5. Daily Founder Brief with ranked recommendations and evidence links.
6. Manual objective and metric entry.
7. Audit log for every sync and recommendation.
8. No LLM writes to external systems.

### Acceptance criteria

- The founder can sign in and see the current objective, target, current progress, and top three priorities.
- Every priority links to at least one source item.
- A failed CI check appears in the brief within one sync cycle.
- A PR older than five working days appears as stale.
- The dashboard shows no more than ten actionable items.
- A user can mark a recommendation accepted, declined, deferred, or needs-more-evidence.
- The system does not create a GitHub issue, send a message, or publish content.
- All sync failures are visible and do not erase previous successful data.

## Delivery phases

### Phase 0: Founder decisions

1. Confirm one 90-day objective.
2. Choose GitHub or Azure DevOps as the work-system source of truth.
3. Define the first ICP and qualification rubric.
4. Name team members, roles, and approval rights.
5. Define the daily brief time and weekly review cadence.

### Phase 1: Founder OS read model

- Objective and metric management.
- Git and Azure health sync.
- Daily brief.
- Audit trail.
- Read-only permissions.

### Phase 2: Controlled work management

- Proposed task generation.
- Agent investigation reports.
- Founder approval queue.
- Team capacity and assignment suggestions.

### Phase 3: Focused GTM CRM

- Lead and company records.
- Campaign attribution.
- Conversation notes and follow-ups.
- ICP scoring with evidence.
- Product-insight loop.

### Phase 4: Founder content queue

- Content evidence library.
- Draft posts and replies.
- Manual review queue.
- Outcome tracking.

### Phase 5: Optional Google Workspace integration

- Calendar-aware follow-up proposals.
- Email-thread references and draft creation.
- No sending permission by default.

## Decisions required before Phase 1

1. Will GitHub remain the source of truth for engineering work, or will Azure DevOps replace it?
2. Which first 90-day route is primary: B2C household validation, employer and HR pilots, adviser partnerships, or insurer partnerships?
3. What defines a qualified conversation for the first ICP?
4. Which team members can approve work, access GTM data, and access product data?
5. What daily brief time and weekly review day work for the founder?

## Risks and controls

| Risk | Control |
|---|---|
| Agent task spam | Daily task cap, `proposed` state, founder approval |
| False agent claims | Evidence links, confidence, schema validation, manual approval |
| Social-account damage | Draft-only public workflow |
| CRM privacy failure | Data separation, source and opt-out records, role-based access |
| AI cost growth | Per-agent budgets, token tracking, model routing, alerts |
| Tool overload | Add integrations only after a recurring decision is proven |
| Conflicting priorities | Every task links to an objective and the founder can override |
| Sensitive-data leakage | No product document content in GTM, content, or agent logs |

## Definition of done for Founder OS V1

Founder OS V1 is done when it reliably produces a short evidence-backed daily brief from the chosen work system and Azure health signals, lets the founder accept or decline recommendations, and has not been granted authority to create external work, post publicly, send outreach, merge, deploy, or access customer documents.
