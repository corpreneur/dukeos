<!-- distributed: v1.1.0 | 2026-04-16T16:09:26.369Z | source: corpreneur/context-commander -->

<!-- distributed: v1.0.2 | 2026-04-08T04:31:17.322Z | source: corpreneur/context-commander -->

# Context Engineering Discipline

> Version: 2.3 | Date: 2026-04-16 | Status: Active | Scope: All AI-assisted implementation work across Vanta Signal, Signal OS, Corpreneur OS, and any Lovable/Cursor/Claude Code build sessions.

## What This Is

Context Engineering is the systematic management of an AI agent's runtime environment and context window to maximize reliability and prevent unexpected failures in complex tasks. It is not prompt writing. It is the upstream practice that determines whether a prompt has any chance of producing useful output.

The core insight: the model's output quality is a function of context quality, not just prompt quality. A perfect prompt in a degraded context window produces slop. A simple prompt in a clean, well-bounded context window produces precise, accurate output.

This reference synthesizes three frameworks:

- **Horthy / HumanLayer** — practitioner workflow (RPI, Intentional Compaction, Dumb Zone) and 12-Factor Agents (stateless reducer, error compaction, small focused agents).
- **Anthropic** — engineering rigor (context rot curve, three-agent architecture, sprint contracts, hybrid retrieval).
- **BMAD Method** — brownfield-specific patterns (analyst-led discovery, PRD-first workflow, codebase flattening, scale-adaptive intelligence).

## Core Principles

1. **Context is a finite resource, not a staging area.** The context window is not a place to accumulate everything that might be relevant. It is a precision instrument. Every token that does not increase the likelihood of the desired output is reducing it.
2. **Degradation is a curve, not a cliff.** Anthropic calls this "context rot." The model does not fail suddenly when the window fills. Accuracy erodes gradually from approximately 40% fill onward. By the time the window is 70% full, the model is operating in a materially different quality regime than it was at 20%.
3. **Compaction is not compression. It is signal extraction.** The goal of compaction is to preserve the signal while discarding the noise...exploratory tangents, abandoned approaches, verbose error logs.
4. **The Stateless Reducer Pattern.** An AI agent should be conceptualized as a stateless reducer function, where the accumulator is the context window. The agent takes the entire context as input, determines the next step, and hands off execution to deterministic code.
5. **Small, Focused Agents.** Build small agents that do one thing well. As context grows, models are more likely to lose focus. Expanding scope should only happen as context windows become more reliable.
6. **Workflow change is required, not just better prompts.** Using smarter models with undisciplined context management does not solve the problem. The workflow must change. Senior practitioners must lead the change.

## The Dumb Zone

**Threshold:** ~40% context window fill.

**What happens:** Attention becomes diffuse. The model struggles to maintain accurate associations between early-context constraints (architecture, data model, patterns) and late-context instructions (what to build now). Output drifts from codebase conventions. Errors appear in edge cases first, then in core logic.

**What it feels like:** The model seems to "forget" established patterns. It starts generating plausible-looking but architecturally inconsistent code. Rework cycles lengthen. Confidence in output drops but the model does not surface uncertainty.

**The rule:** Do not submit an implementation prompt when active context exceeds 40% fill. Compact first.

## The RPI Workflow

Three phases. Two human review gates. Each phase runs in a separate, clean context.

### Phase 1: Research

**Objective:** Build an accurate map of the codebase surface area relevant to the task. No changes. No suggestions.

**Inputs:**
- Task description
- CONTEXT.md from the prior session (if continuing existing work)
- CLAUDE.md or equivalent system context

**Process:**
- Identify relevant files by path
- Identify existing patterns, components, and utilities the task must follow
- Identify data model constraints (schema, interfaces, RLS policies)
- Identify API contracts and auth constraints
- Document ambiguities that must be resolved before planning

**Output: `research.md`**
- Structured list of relevant files with paths
- Key patterns and conventions observed
- Constraints that bound the implementation
- Open questions requiring resolution

**Human gate:** Read research.md before proceeding. Verify the model understood the codebase correctly. Correct any misunderstandings at this stage. It is cheap to correct here. It is expensive to correct after implementation.

### Phase 2: Plan

**Objective:** Produce a step-by-step implementation outline a human can read, review, and approve.

**Inputs:**
- research.md (output of Phase 1 only)
- System context

**Process:**
- Translate research findings into an ordered list of changes
- Each step includes: file path, component or function name, what changes and why
- Flag any step that requires a decision before execution
- Identify dependencies between steps (what must complete before what)

**Output: `plan.md`**
- Numbered implementation steps
- File paths and line references where available
- Decision points flagged explicitly
- Success criteria for each major step

**Human gate:** Read plan.md before proceeding. This is the last point at which you can redirect without writing code. If a step looks wrong, fix the plan. Do not ask the model to course-correct mid-implementation.

### Phase 3: Implement

**Objective:** Execute the plan exactly. Nothing more.

**Inputs:**
- plan.md (output of Phase 2 only)
- System context
- Full tool suite: Read, Edit, Write, MultiEdit

**Constraints:**
- No scope expansion without stopping and flagging
- No refactoring outside the plan
- No new dependencies not specified in the plan
- If context fills to 40%, stop, compact, and continue in a new session with SESSION_SUMMARY.md

## Intentional Compaction & Error Handling

**When to compact:**
- Context window approaches 40% fill
- A session has drifted through exploration, debugging, and multiple tangents
- Starting a new task that is logically distinct from what preceded it
- **Error Compaction:** When an agent encounters an error, the raw stack trace should not simply be appended to the context window. Errors must be compacted and restructured. If a tool fails repeatedly, break the loop, reset the context, or escalate to a human.

**Compaction steps:**

1. Before closing the session, ask the model to produce `SESSION_SUMMARY.md`:

```markdown
# Session Summary
- Date: [date]
- Session focus: [1 sentence]

## What was built
[Concise description of completed work]

## Current state
- Working: [list]
- In progress: [list]
- Broken or incomplete: [list]

## Files modified
- [path] — [what changed]

## Open decisions
- [decision pending]

## Next session start point
[Specific first action for next session, with file path]
```

2. Commit SESSION_SUMMARY.md to the repo as `CONTEXT.md`.
3. Open a new session. Inject only:
   - System instructions
   - CONTEXT.md
   - Files specifically relevant to the next task
4. Do not paste raw prior conversation.

## Sparse Priming Representations (SPR)

SPR is a technique for compressing knowledge into activation-efficient representations that fit in minimal context while recovering full conceptual fidelity.

The mechanism: LLMs are associative. You do not need to paste the full contents of a file to activate the model's understanding of it. A concise set of declarative statements targeting the relevant concepts achieves the same activation at a fraction of the tokens.

**Compression ratio:** Approximately 10:1 over raw text while preserving key associations.

**Where to apply:**
- Operating Briefs across all entities (VANTA, BROADVEST, DOTCO, CORPRENEUR, PERSONAL)
- PRD sections used as context in build sessions
- Architecture documents referenced at the start of implementation sessions
- Codebase context files (the CLAUDE.md equivalent for each repo)

## Harness Design & Configuration Surfaces

Effective harness engineering leverages nine primary configuration surfaces to manage context windows and keep the agent out of the Dumb Zone.

1. **Agentfiles (`CLAUDE.md` / `AGENTS.md`):** Keep them concise (under 60 lines), universally applicable, and rely on progressive disclosure. Support a `.local` override layer (gitignored) for developer-specific customization without team conflict.
2. **MCP Servers and Tools:** Limit exposed tools. If a CLI exists in the model's training data (e.g., Git, Docker), prompt the agent to use the CLI rather than a custom MCP server to save tokens.
3. **Skills for Reusable Knowledge:** Use skills for progressive disclosure. Load `SKILL.md` files only when specific instructions are needed.
4. **Sub-Agents for Context Control:** Use sub-agents as "context firewalls" to encapsulate complex tasks and prevent intermediate noise from polluting the primary agent's context.
5. **Hooks for Deterministic Guardrails:** Execute deterministic scripts at specific lifecycle points. Pre-hooks validate input before tool execution (e.g., block dangerous shell commands). Post-hooks enforce standards after tool execution (e.g., run linter after file write). Hooks are deterministic code, not LLM calls — they make constraints active rather than advisory.
6. **Back-Pressure for Verification:** Ensure verification mechanisms are context-efficient. Success must be silent; only failures should produce verbose output.
7. **Commands for Repeatable Workflows:** Define reusable prompt templates as markdown files, triggered via slash syntax (e.g., `/project:review`). Commands inject structured context only when invoked, keeping the base context clean. Any repeatable agent workflow — review, fix-issue, deploy, refactor — should be a command, not a re-typed prompt.
8. **Layered Configuration (Base + Local Override):** Every configuration surface should support a base layer (committed to git, team-shared) and a local layer (gitignored, developer-specific). The local layer overrides the base layer with merge semantics (local wins, not append). This applies to agentfiles (`CLAUDE.md` + `CLAUDE.local.md`), settings (`settings.json` + `settings.local.json`), and any other config surface.
9. **Path-Scoped Rules:** Rules and constraints can target specific files or directory paths via glob patterns. A rule for `src/api/` only activates when working in that directory. This enables fine-grained context injection — API conventions load only when editing API files, test conventions load only when editing tests. Reduces noise and improves signal density (Dumb Zone avoidance).

### The Three-Agent Architecture & Sprint Contracts

For long-running application development, Anthropic recommends a specialized multi-agent architecture:

- **Planner:** Expands simple prompts into comprehensive product specifications, avoiding granular technical details to prevent cascading errors.
- **Generator:** Implements the specification one feature at a time in structured sprints, self-evaluating before handoff.
- **Evaluator:** Tests the implementation against the specification using browser automation, enforcing hard thresholds for quality.

**Sprint Contracts:** Before any code is written, the Generator and Evaluator negotiate a "sprint contract" to agree on the definition of done. This bridges the gap between high-level user stories and testable implementation, communicating via structured files to avoid context bloat.

## Hybrid Retrieval Pattern (Anthropic)

**Static context up front:**
- CLAUDE.md or system context: architecture decisions, conventions, constraints, tech stack
- This content never changes within a session. Load it once.

**Just-in-time exploration:**
- Do not pre-load all potentially relevant files
- Let the Research phase identify what is actually needed
- Load files at the point they are required, not before
- **Pre-Fetching Context:** If there is a high probability that an agent will need specific information (e.g., Git tags), pre-fetch this context deterministically before invoking the model to save token round-trips.

## Sub-Agent Context Isolation

For multi-agent systems (Labor OS, n8n workflows, Signal OS), each agent should operate in an isolated context partition.

**Pattern:**
- Orchestrator holds the task graph and state, not the raw content
- Sub-agents receive only the context slice relevant to their task
- Sub-agents return condensed summaries, not raw outputs, to the orchestrator
- The orchestrator never passes a sub-agent's full output to another sub-agent directly

**Why:** Context accumulation across agent handoffs is the primary source of multi-agent drift. Each compounding context pass degrades the overall system accuracy. Sub-agents should compress before returning.

## BMAD Brownfield Patterns

For established codebases with existing architecture, data models, and conventions, the BMAD (Build More Architect Dreams) framework provides structured methodologies:

- **Codebase Flattening:** Compile the entire repository into a single, structured XML file. This flattened artifact acts as a comprehensive reference that can be selectively queried, ensuring only relevant context is loaded.
- **PRD-First Brownfield Workflow:** Before implementation, a Product Manager agent creates a focused PRD. An Architect agent then uses this PRD to document *only* the specific modules affected by the changes, intentionally skipping unrelated areas. This focused architecture document serves as the primary context for the Developer agent.
- **Scale-Adaptive Intelligence:** Adjust the depth of planning based on task complexity. A minor bug fix requires minimal context, whereas a major feature triggers the full PRD and architecture workflow.

Never collapse these phases. The planning phase produces the context that makes the development phase accurate.

## Multi-Agent Handoffs

The principles above apply not only within a single agent session but across the boundaries between agents in a multi-agent pipeline. When multiple AI agents collaborate on the same codebase, context management becomes a coordination problem, not just a capacity problem.

**The Three-Node Pipeline (Manus / Lovable / Claude):**

The active development pipeline assigns each agent a distinct role aligned with its strengths. Manus operates as the Product Engineer and Planner, writing feature specs and Lovable prompts while enforcing the context budget. Lovable operates as the Builder and Generator, executing prompts and pushing code to GitHub. Claude operates as the Staff Engineer and Refactorer, auditing PRs against the original spec and executing deep architectural cleanup.

**Handoff Protocol:**

Every handoff between agents must pass through GitHub. Manus pushes specs to the repo. Lovable pushes feature branches and opens PRs. Claude reviews PRs and pushes refactoring commits. The `CONTEXT.md` session handoff file is updated at each cycle boundary to prevent context rot from compounding across agent transitions.

**Context Isolation at Handoff:**

When Manus generates cleanup instructions for Claude, the instructions must include only the specific files that need refactoring and the original Acceptance Criteria for the feature. The full project history, Lovable chat logs, and exploratory research from the Manus session must not be forwarded. Each agent receives a clean, compacted context slice relevant to its specific task.

**Audit Before Handoff:**

Before handing off to Claude for refactoring, Manus must audit the as-built code against the original spec using the `audit-checklist.md`. This ensures that functional issues are sent back to Lovable (which built the feature and has the UI context), while architectural issues are routed to Claude (which is optimized for deep refactoring).

The full pipeline architecture, Claude refactoring prompt template, and audit checklist are documented in `docs/pipeline/`.

## Application to the Active Build Stack

| Build Surface | Primary Risk | Protocol |
|---|---|---|
| Vanta Signal (Lovable) | Session drift across sprints | RPI gate + CONTEXT.md on every session close; apply Sprint Contracts |
| Signal OS (Lovable + Supabase) | Schema context loss | SPR-compress data model; inject at session start |
| Corpreneur OS skill files | Skill scope creep during editing | Intentional Compaction before each skill update |
| Labor OS agents | Multi-agent context bleed | Sub-agent isolation; condensed return summaries |
| n8n workflows | Node context confusion | BMAD analyst pass before each workflow extension |

## Related References

- `prompt-optimization-addendum.md` — Dumb Zone threshold, Intentional Compaction, RPI workflow, Harness Configuration Surfaces
- `lovable-prompt-template.md` — RPI gate and context budget template
- `docs/pipeline/pipeline-architecture.md` — Three-agent pipeline (Manus / Lovable / Claude)
- `docs/pipeline/claude-refactor-prompt.md` — Template for generating Claude cleanup instructions
- `docs/pipeline/audit-checklist.md` — Standard for auditing as-built code against spec
- `docs/research/claude-code-project-structure.md` — Hooks, commands, layered config, path-scoped rules (source for surfaces 7-9)
- HumanLayer: 12-Factor Agents - Principles for building reliable LLM applications
- HumanLayer: Skill Issue — Harness Engineering for Coding Agents (Mar 2026)
- Anthropic: Effective Harnesses for Long-Running Agents (Nov 2025)
- Anthropic: Harness Design for Long-Running Application Development (Mar 2026)
- BMAD Code: Breakthrough Method for Agile Ai Driven Development (2026)
