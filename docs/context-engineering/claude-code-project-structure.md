<!-- distributed: v1.1.0 | 2026-04-16T16:09:51.896Z | source: corpreneur/context-commander -->

# Claude Code Project Structure — Research Notes

> Version: 1.0 | Date: 2026-04-16 | Status: Active

Source: GenAI.works infographic + Claude Code documentation

## Overview

Claude Code uses a file-based project structure to configure agent behavior at session start. The structure implements several context engineering principles documented in this repo — and introduces patterns not yet formalized in our harness configuration surfaces.

## Structure Map

```
CLAUDE.md              → Project overview, tech stack, conventions. Loaded at session start.
CLAUDE.local.md        → Local overrides (gitignored). Layered on top of CLAUDE.md.
.mcp.json              → MCP integration configs (GitHub, JIRA, Slack, DBs). Shared via git.
.claude/
  settings.json        → Permissions, tool access, model selection, hooks.
  settings.local.json  → Local overrides for settings.
  rules/               → Modular .md files by topic. Can target specific files/paths.
    code-style.md
    testing.md
    api-conventions.md
  commands/             → Custom slash commands (/project:<name>). Repeatable workflows.
    review.md
    fix-issue.md
  skills/               → Auto-triggered based on task context. Loads only when needed.
    deploy/
      SKILL.md
      deploy-config.md
  agents/               → Specialized sub-agents with roles, isolated context windows.
    code-reviewer.md
    security-auditor.md
  hooks/                → Event-driven scripts (pre/post tool use). Validation, linting, blocking.
    validate-bash.sh
```

## Mapping to Context Engineering Principles

### Already Documented

| Claude Code Pattern | Context Commander Equivalent | Reference |
|---|---|---|
| `CLAUDE.md` loaded at session start | `CONTEXT.md` session handoff | Prompt Optimization Addendum §Session Handoff |
| `agents/` with isolated context windows | Three-agent pipeline (Manus/Lovable/Claude) | Pipeline Architecture, CE Discipline §Sub-Agents |
| `rules/` as modular markdown | ADR-driven workflows (executable constraints) | ADR-0001, ADR-0002, CE Discipline §Agentfiles |
| `skills/` loading only when needed | JIT retrieval, Dumb Zone avoidance | Prompt Optimization Addendum §Compaction, Anthropic CE §Retrieval |
| `.mcp.json` for tool integrations | MCP Servers harness surface | CE Discipline §Harness Configuration Surfaces |

### Net-New Patterns

#### 1. Hooks — Deterministic Guardrails

Event-driven scripts that fire pre/post tool use. Automate validation, linting, formatting. Block unsafe operations before they execute.

**Why this matters:** 12-Factor Agents Factor 10 implies deterministic guardrails but our docs don't formalize the hook pattern. Hooks are the enforcement layer — they make constraints active rather than advisory.

**Mapping:** Extends our "Hooks" harness surface (currently described as lifecycle triggers). Claude Code's implementation shows hooks as shell scripts with pre/post semantics per tool invocation.

**Pattern:**
- Pre-hook: validate input before tool executes (e.g., block `rm -rf /`)
- Post-hook: lint/format output after tool executes (e.g., run prettier after file write)
- Hooks are deterministic code, not LLM calls — aligns with Factor 12 (deterministic > agentic)

#### 2. Commands — Repeatable Workflow Templates

Custom slash commands defined as markdown files. Each command is a reusable prompt template triggered by `/project:<name>`.

**Why this matters:** Our distribution system is a manual version of this pattern. Commands generalize it: any repeatable agent workflow (review, fix-issue, deploy, refactor) becomes a one-shot invocation.

**Mapping:** Extends our Lovable Prompt Template concept. The template becomes executable — not just a format guide but a triggerable action.

**Pattern:**
- Command = markdown file with structured prompt
- Invoked via slash syntax, injected into context at call time
- Keeps base context clean (command content only loaded when triggered)

#### 3. Layered Configuration — Base + Local Override

`CLAUDE.md` + `CLAUDE.local.md`. `settings.json` + `settings.local.json`. Base config is shared via git. Local overrides are gitignored.

**Why this matters:** Our current model assumes a single CONTEXT.md per repo. Layered config enables team-shared conventions with individual developer overrides — critical for multi-contributor repos.

**Mapping:** Not yet in our harness configuration surfaces. Should be added as a principle: every config surface should support a `.local` override.

**Pattern:**
- Base layer: committed to git, team-shared, defines project conventions
- Local layer: gitignored, developer-specific, overrides base without conflict
- Merge semantics: local values override base values (not append)

#### 4. Path-Scoped Rules — Fine-Grained Context Injection

Rules in `.claude/rules/` can target specific files or directory paths. A rule for `src/api/` only activates when working in that directory.

**Why this matters:** Our ADRs are project-wide constraints. Path-scoped rules allow context-sensitive constraints — API conventions only load when editing API files, test conventions only load when editing tests.

**Mapping:** Extends our ADR-driven workflows. ADRs could carry a `scope` field specifying which paths they apply to, enabling JIT injection based on the files being modified.

**Pattern:**
- Rule file includes a path glob or directory target
- Agent runtime checks which files are in the current task's scope
- Only matching rules are injected into context
- Reduces noise, improves signal density (Dumb Zone avoidance)

## Cross-Cutting Themes

Context is layered, not monolithic. Base + local + path-scoped = three levels of specificity.
Deterministic enforcement (hooks) complements advisory context (rules/ADRs).
JIT loading everywhere — skills, commands, path-scoped rules all defer context injection until needed.
Repeatable workflows (commands) reduce prompt engineering per invocation.
Sub-agent isolation (agents/) keeps context windows focused — mirrors Factor 10.
The entire structure is file-based and git-native — no external tooling required for configuration.

## Recommendations for Context Commander

1. Add Hooks, Commands, Layered Config, and Path-Scoped Rules as harness configuration surfaces in CE Discipline v2.3.
2. Consider adding a `scope` field to ADR templates for path-targeted constraint injection.
3. Evaluate whether CONTEXT.md should support a CONTEXT.local.md override pattern.
4. Document the command pattern as an evolution of the Lovable Prompt Template — from format guide to executable action.
5. Create a CLAUDE.md for this repo to dogfood the pattern.
