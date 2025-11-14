# 🏗️ AGENT CREATION TEMPLATE & GUIDE

## 📋 PURPOSE

This document is a **blueprint for creating new agents** in our multi-agent system. Follow this template to create agents with the same professional structure and quality as our Analysis Agent and Integration Test Agent.

**Use this when**:

- Creating a new agent from scratch
- Ensuring consistency across all agents
- Building agents that integrate with existing agents
- Teaching others how to create agents

---

## 🎯 THE PROVEN PATTERN

Our agents follow a **skills-based architecture** with these characteristics:

### ✅ Core Principles

1. **"Everything in One File" Philosophy**

   - One master file contains complete instructions
   - AI gets entire context in single file
   - No need to jump between files during operation

2. **Skills-Based Architecture**

   - Agent capabilities broken into discrete skills
   - Each skill has a specific, focused purpose
   - Skills numbered sequentially (0, 1, 2, ... OR 1, 2, 3, ...)

3. **Detailed Skill Files**

   - Each skill documented in separate file
   - Located in `skills/` subdirectory
   - Contains workflow, examples, validation

4. **Clear Integration Points**
   - Agents work together in workflows
   - Output format matches next agent's input
   - Handoff verification built-in

---

## 📐 AGENT STRUCTURE BLUEPRINT

### Directory Structure

```
docs/agents/[agent-name]/
├── [AGENT-NAME]_MASTER.md           ← The complete instruction file
├── README.md                         ← Human-readable overview
├── FINAL_REVIEW_AND_IMPROVEMENTS.md  ← Quality documentation
└── skills/
    ├── skill-name-1.md               ← Skill 0 or 1
    ├── skill-name-2.md               ← Skill 1 or 2
    ├── skill-name-3.md               ← Skill 2 or 3
    └── ...                           ← More skills
```

### Example (Analysis Agent)

```
docs/agents/analysis-agent/
├── ANALYSIS_AGENT_MASTER.md
├── README.md
├── FINAL_REVIEW_AND_IMPROVEMENTS.md
└── skills/
    ├── service-code-analysis.md                    (Skill 1)
    ├── prisma-schema-deep-analysis.md              (Skill 2)
    ├── foreign-key-analysis.md                     (Skill 3)
    ├── test-scenario-recommendation.md             (Skill 5)
    ├── import-typescript-error-prevention.md       (Skill 7)
    ├── creative-edge-case-detection.md             (Skill 8)
    ├── test-plan-document-structure.md             (Skill 9)
    └── integration-agent-handoff-preparation.md    (Skill 10)
```

---

## 🔨 STEP-BY-STEP CREATION PROCESS

### PHASE 1: PLANNING

#### Step 1: Define Agent Purpose

**Answer these questions**:

1. **What is the agent's core job?**

   - In one sentence: "This agent [does what]"
   - Example: "This agent analyzes service files and creates test plans"
   - Example: "This agent implements integration tests from test plans"

2. **What problem does it solve?**

   - What manual work does it eliminate?
   - What bottleneck does it remove?

3. **Where does it fit in the workflow?**

   - What comes before this agent?
   - What comes after this agent?
   - What other agents does it interact with?

4. **What does it receive as input?**

   - Files? Documents? Code? Commands?
   - From humans or from other agents?

5. **What does it produce as output?**
   - Files? Documents? Code? Reports?
   - For humans or for other agents?

**Example (Analysis Agent)**:

```
1. Core job: Analyze service files and create comprehensive test plans
2. Problem solved: Manual test planning takes 4-6 hours per service
3. Workflow position: Receives service files → Outputs test plans → Integration Agent
4. Input: Service file (TypeScript), Prisma schema
5. Output: Structured test plan document ready for Integration Agent
```

#### Step 2: Identify Required Skills

**Brainstorm capabilities**:

- What specific tasks must the agent perform?
- Break complex tasks into atomic skills
- Each skill = one focused capability

**Skill categories to consider**:

- Analysis skills (reading, parsing, understanding)
- Generation skills (creating, writing, building)
- Validation skills (checking, verifying, testing)
- Integration skills (handoff, compatibility, formatting)
- Creative skills (edge cases, scenarios, alternatives)

**Example (Analysis Agent)**:

```
Skill 1: Service Code Analysis → Read and understand TypeScript service files
Skill 2: Prisma Schema Analysis → Parse database schema from schema.prisma
Skill 3: Foreign Key Analysis → Map FK relationships and cascades
Skill 5: Test Scenario Recommendation → Generate 10-20 tests per method
Skill 7: Import Validation → Ensure correct import paths
Skill 8: Creative Edge Case Detection → Think of unusual scenarios
Skill 9: Output Formatting → Structure test plan document
Skill 10: Integration Compatibility → Verify handoff to next agent
```

**Aim for**:

- Minimum: 5-8 skills (core capabilities)
- Sweet spot: 8-12 skills (comprehensive)
- Maximum: 15-20 skills (complex agents)

#### Step 3: Plan Integration Points

**Questions to answer**:

1. **What agents come before this one?**

   - What do they provide?
   - What format is their output?

2. **What agents come after this one?**

   - What do they need?
   - What format should output be?

3. **Compatibility requirements?**
   - Import paths?
   - Function signatures?
   - File locations?
   - Data structures?

**Create integration skills**:

- Input validation skill (if receiving from another agent)
- Output formatting skill (if sending to another agent)
- Handoff verification skill (ensure compatibility)

---

### PHASE 2: MASTER FILE CREATION

#### Step 4: Create Master File Structure

**File name**: `[AGENT-NAME]_MASTER.md`

**Required sections** (in order):

```markdown
# 🎯 [AGENT NAME] - COMPLETE INSTRUCTION MANUAL

## ⚡ QUICK START

[2-3 sentences on what this agent does and how to use it]

## 🤖 WHAT YOU ARE

[Define the agent's identity, role, and core responsibility]

## 🔍 BEFORE YOU START: SELF-CHECK

[Questions the agent should ask itself before beginning work]

## 💼 YOUR CORE JOB

[Detailed description of the agent's primary function]

## 📊 YOUR SKILLS REFERENCE TABLE

| Skill # | Skill Name | File             | Status | When to Use |
| ------- | ---------- | ---------------- | ------ | ----------- |
| 0/1     | [Name]     | skills/[file].md | ✅/🚧  | [Trigger]   |
| ...     | ...        | ...              | ...    | ...         |

## 📋 REQUEST PATTERNS

[How users/agents can request work - show 2-4 common patterns]

## 🎯 THE RULES (NEVER BREAK THESE)

[Non-negotiable rules the agent must follow]

## 🔄 YOUR WORKFLOW

[Step-by-step process the agent follows]

## 📈 SKILL IMPLEMENTATION STATUS

[Table showing which skills are production-ready]

## YOUR [NUMBER] SKILLS

### Skill 0/1: [Skill Name]

**File**: `skills/[filename].md`
**Purpose**: [What this skill does]
**When to Use**: [Triggers for this skill]
**Key Capabilities**: [Bullet list of what this skill provides]

[Repeat for all skills]

## 📤 OUTPUT TEMPLATE

[Show exact format of agent's output]

## 💡 EXAMPLES

[2-3 complete examples showing agent in action]

## ✅ VALIDATION CHECKLIST

[How to verify the agent completed work correctly]

---

**Remember**: You are [Agent Name]. [Core identity statement].
```

#### Step 5: Write Each Section

**Section 1: QUICK START**

- 2-3 sentences maximum
- State what agent does
- State how to use it
- Make it actionable

```markdown
## ⚡ QUICK START

This agent [does X]. Give it [input Y] and it will [produce output Z].
Use this agent when you need to [accomplish goal].
```

**Section 2: WHAT YOU ARE**

- Define identity clearly
- State core competencies
- Explain value proposition
- Set boundaries (what agent does NOT do)

```markdown
## 🤖 WHAT YOU ARE

You are the [Agent Name], an expert AI agent specialized in [domain].

**Your Core Competencies**:

- [Competency 1]
- [Competency 2]
- [Competency 3]

**Your Value**: You [provide value by doing X].

**What You Don't Do**:

- [Not this]
- [Not that]
```

**Section 3: SELF-CHECK**

- 3-5 critical questions
- Agent asks itself BEFORE starting work
- Ensures agent has context needed
- Prevents wasted effort

```markdown
## 🔍 BEFORE YOU START: SELF-CHECK

Ask yourself:

1. Do I have [required input]?
2. Do I understand [key requirement]?
3. Have I [prerequisite check]?
4. Is [condition] met?
5. Do I know where [output] should go?

If ANY answer is NO → Ask the user for clarification.
```

**Section 4: YOUR CORE JOB**

- Detailed job description
- 2-4 paragraphs
- Explain end-to-end process
- Mention integration points

```markdown
## 💼 YOUR CORE JOB

Your job is to [primary function]. You receive [input] from [source]
and transform it into [output] for [destination].

[Detailed explanation of the process]

[Explain quality standards]

[Mention integration with other agents/users]
```

**Section 5: SKILLS REFERENCE TABLE**

- **CRITICAL**: Must include this table
- Shows all skills at a glance
- Located AFTER "Your Core Job"
- Before detailed skill sections

```markdown
## 📊 YOUR SKILLS REFERENCE TABLE

| Skill # | Skill Name | File             | Status    | When to Use |
| ------- | ---------- | ---------------- | --------- | ----------- |
| 1       | [Name]     | skills/[file].md | ✅ Ready  | [Trigger]   |
| 2       | [Name]     | skills/[file].md | ✅ Ready  | [Trigger]   |
| 3       | [Name]     | skills/[file].md | 🚧 Future | [Trigger]   |

**Status Key**:

- ✅ Ready: Production-ready, fully implemented
- 🚧 Future: Planned for future implementation
- 🔄 In Progress: Currently being developed
```

**Section 6: REQUEST PATTERNS**

- Show 2-4 common request formats
- Give exact phrasing examples
- Cover main use cases

```markdown
## 📋 REQUEST PATTERNS

### Pattern 1: [Pattern Name]

**When**: [Situation]
**Request**: "[Exact phrasing example]"
**You Will**: [What agent does]

### Pattern 2: [Pattern Name]

**When**: [Situation]
**Request**: "[Exact phrasing example]"
**You Will**: [What agent does]
```

**Section 7: THE RULES**

- Non-negotiable constraints
- 5-10 critical rules
- Use strong language (NEVER, ALWAYS, MUST)

```markdown
## 🎯 THE RULES (NEVER BREAK THESE)

1. **ALWAYS** [critical rule]
2. **NEVER** [forbidden action]
3. **MUST** [requirement]
4. **DO NOT** [warning]
5. [More rules...]
```

**Section 8: YOUR WORKFLOW**

- Step-by-step process
- Number each step
- Show decision points
- Include validation steps

```markdown
## 🔄 YOUR WORKFLOW

**Step 1**: [Action]

- [Detail]
- [Detail]

**Step 2**: [Action]

- [Detail]
- If [condition], then [branch]

**Step 3**: [Action]

- [Detail]

[Continue through complete workflow]
```

**Section 9: SKILL IMPLEMENTATION STATUS**

- Table showing skill readiness
- Grouped by status (Ready, Future, Planned)

```markdown
## 📈 SKILL IMPLEMENTATION STATUS

### ✅ Production-Ready Skills (X/Y)

- Skill 1: [Name]
- Skill 2: [Name]

### 🚧 Future Skills (X/Y)

- Skill X: [Name]
```

**Section 10: YOUR [N] SKILLS**

- Detailed description of each skill
- Links to skill files
- Purpose, when to use, key capabilities

```markdown
## YOUR 10 SKILLS

### Skill 1: [Skill Name]

**File**: `skills/[filename].md`
**Purpose**: [One sentence purpose]
**When to Use**: [Triggering conditions]

**Key Capabilities**:

- [Capability 1]
- [Capability 2]
- [Capability 3]

**Output**: [What this skill produces]

---

### Skill 2: [Skill Name]

[Same format]
```

**Section 11: OUTPUT TEMPLATE**

- Show exact output format
- Include all sections
- Show structure clearly
- Use markdown code blocks

```markdown
## 📤 OUTPUT TEMPLATE

Your output must follow this exact structure:

\`\`\`markdown

# [Output Title]

## Section 1: [Name]

[Content format]

## Section 2: [Name]

[Content format]

[All sections...]
\`\`\`
```

**Section 12: EXAMPLES**

- 2-3 complete examples
- Show input → agent work → output
- Cover different scenarios
- Be realistic

```markdown
## 💡 EXAMPLES

### Example 1: [Scenario Name]

**Input**:
\`\`\`
[Example input]
\`\`\`

**Agent Work**:

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Output**:
\`\`\`
[Example output]
\`\`\`

---

### Example 2: [Scenario Name]

[Same format]
```

**Section 13: VALIDATION CHECKLIST**

- How to verify work is complete
- 8-12 checkpoints
- Measurable criteria

```markdown
## ✅ VALIDATION CHECKLIST

Before finishing, verify:

- [ ] [Checkpoint 1]
- [ ] [Checkpoint 2]
- [ ] [Checkpoint 3]
- [ ] All skills used appropriately
- [ ] Output format matches template
- [ ] Integration compatibility verified
- [ ] Quality standards met
- [ ] User requirements satisfied

If ALL checked → Work complete! ✅
```

**Final Line**:

```markdown
---

**Remember**: You are [Agent Name]. [One sentence identity]. [One sentence mission].
```

---

### PHASE 3: SKILL FILES CREATION

#### Step 6: Create Each Skill File

**File name**: `skills/[descriptive-kebab-case-name].md`

**Required sections in each skill file**:

```markdown
# Skill [#]: [Skill Name]

## 🎯 PURPOSE

[2-3 sentences explaining what this skill does and why it's needed]

## 📋 WHEN TO USE THIS SKILL

Use this skill when:

- [Trigger 1]
- [Trigger 2]
- [Trigger 3]

Do NOT use when:

- [Anti-pattern 1]
- [Anti-pattern 2]

## 🔄 SKILL WORKFLOW

**Step 1: [Phase Name]**

1. [Action]
2. [Action]
3. [Action]

**Step 2: [Phase Name]**

1. [Action]
2. [Action]

[Continue through complete skill workflow]

## 🎯 SKILL OUTPUT

This skill produces:

\`\`\`[format]
[Example output structure]
\`\`\`

**Output Requirements**:

- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## 💡 EXAMPLES

### Example 1: [Scenario]

**Input**: [Input]
**Process**: [Steps]
**Output**: [Output]

### Example 2: [Scenario]

[Same format]

## ✅ VALIDATION CHECKLIST

- [ ] [Quality check 1]
- [ ] [Quality check 2]
- [ ] [Quality check 3]
- [ ] [Quality check 4]
- [ ] [Quality check 5]

## 🚨 COMMON PITFALLS

**Pitfall 1: [Issue]**

- Problem: [Description]
- Solution: [Fix]

**Pitfall 2: [Issue]**

- Problem: [Description]
- Solution: [Fix]

## 🎓 BEST PRACTICES

1. **[Practice Name]**: [Description]
2. **[Practice Name]**: [Description]
3. **[Practice Name]**: [Description]

---

**Skill Status**: ✅ Production Ready
**Last Updated**: [Date]
**Integration**: [Which agents/skills this connects to]
```

#### Step 7: Skill File Quality Standards

**Each skill file must have**:

1. **Clear Purpose** (what and why)
2. **Triggering Conditions** (when to use)
3. **Step-by-Step Workflow** (how to execute)
4. **Output Format** (what it produces)
5. **Examples** (2-3 realistic scenarios)
6. **Validation Checklist** (quality verification)
7. **Common Pitfalls** (what to avoid)
8. **Best Practices** (tips for excellence)

**Size guidelines**:

- Minimum: 500 words
- Target: 1,000-2,000 words
- Complex skills: 2,000-5,000 words

**Tone**:

- Direct and actionable
- Use "you" (addressing the AI agent)
- Imperative commands (Do this, Check that)
- Professional but clear

---

### PHASE 4: INTEGRATION & COMPATIBILITY

#### Step 8: Create Integration Skills

If your agent works with other agents, create these skills:

**Skill: Input Validation** (if receiving from another agent)

```markdown
# Skill X: [Previous Agent Name] Input Validation

## PURPOSE

Verify input from [Previous Agent] is complete and compatible.

## WHAT TO CHECK

- [ ] Required sections present
- [ ] Data format matches expectations
- [ ] File paths are correct
- [ ] Function signatures match
- [ ] All dependencies available

## IF VALIDATION FAILS

1. Identify what's missing
2. Request clarification/correction
3. Do NOT proceed with invalid input
```

**Skill: Output Formatting** (if sending to another agent)

```markdown
# Skill Y: [Next Agent Name] Output Formatting

## PURPOSE

Format output exactly as [Next Agent] requires.

## OUTPUT REQUIREMENTS

[Detailed specification of output format]

## COMPATIBILITY CHECKLIST

- [ ] All required sections included
- [ ] Format matches [Next Agent]'s expectations
- [ ] Paths use correct conventions
- [ ] Function signatures documented
- [ ] No ambiguities
```

**Skill: Handoff Verification** (compatibility check)

```markdown
# Skill Z: [Next Agent Name] Handoff Preparation

## PURPOSE

Verify output will work seamlessly with [Next Agent].

## VERIFICATION STEPS

1. Check import paths (relative, absolute, aliases)
2. Verify function signatures (parameters, types, order)
3. Validate file locations (correct directories)
4. Confirm data structures (matching schemas)
5. Test compatibility (mock handoff)

## HANDOFF DOCUMENT

Include this section in output:

- What's provided
- Where files go
- How to use output
- Known constraints
- Contact point for issues
```

#### Step 9: Define Output Format

**Create template showing**:

- Exact section structure
- Section order (numbered)
- Required vs optional sections
- Format for each section (markdown, code, data)
- Size guidelines (lines/words per section)

**Example**:

```markdown
## 📤 OUTPUT TEMPLATE

\`\`\`markdown

# [Main Title]

## 1. Header & Metadata

- Agent Name: [Name]
- Date: [Date]
- Version: [Version]
- Status: [Status]

## 2. Input Summary

[What was received]

## 3. Analysis/Processing

[What was done]

## 4. Results

[What was produced]

## 5. [Next Agent] Handoff

✅ Ready for [Next Agent]
✅ All requirements met
✅ Output location: [Path]

## 6. Notes

[Additional context]
\`\`\`
```

---

### PHASE 5: DOCUMENTATION

#### Step 10: Create README.md

**Purpose**: Human-readable overview for documentation browsers

```markdown
# [Agent Name]

## Overview

[2-3 sentence description]

## Purpose

[What problem does this solve?]

## Usage

[How to use this agent]

## Skills

[List of all skills with brief descriptions]

## Integration

[Which agents this works with]

## Files

- `[AGENT-NAME]_MASTER.md` - Complete agent instructions
- `skills/` - Individual skill documentation
- `FINAL_REVIEW_AND_IMPROVEMENTS.md` - Quality documentation

## Getting Started

[Quick start instructions]

## See Also

- [Link to related agents]
- [Link to step-by-step guide]
```

#### Step 11: Create Review Document

**File**: `FINAL_REVIEW_AND_IMPROVEMENTS.md`

**Sections**:

1. Overview (what agent does, version, status)
2. Skills Summary (table of all skills)
3. Quality Metrics (completeness, integration, documentation)
4. Comparison with Similar Agents (if applicable)
5. User Requirements Verification (checklist)
6. Final Assessment (score, verdict)

**Purpose**:

- Document quality standards
- Show completeness
- Verify requirements met
- Record review process

---

### PHASE 6: TESTING & VALIDATION

#### Step 12: Test Agent with AI

**Testing process**:

1. **Load master file to AI** (Claude, GPT-4, etc.)

   - Copy entire master file
   - Paste into AI chat
   - Verify AI understands role

2. **Test basic functionality**

   - Give AI typical request
   - Verify it uses correct skills
   - Check output format

3. **Test edge cases**

   - Incomplete input
   - Ambiguous requests
   - Error scenarios

4. **Test integration**

   - If agent has predecessor, test receiving input
   - If agent has successor, test producing output
   - Verify handoff works smoothly

5. **Test all request patterns**
   - Try each pattern from REQUEST PATTERNS section
   - Verify agent responds appropriately

#### Step 13: Quality Checklist

Before finalizing agent, verify:

**Master File Quality**:

- [ ] All 13 required sections present
- [ ] Skills reference table included
- [ ] Request patterns documented (2-4 patterns)
- [ ] The Rules section has 5-10 rules
- [ ] Workflow is step-by-step and clear
- [ ] Output template is specific and complete
- [ ] Examples are realistic and helpful
- [ ] Validation checklist has 8-12 items
- [ ] File is well-formatted (headers, bullets, code blocks)
- [ ] No typos or grammatical errors

**Skill Files Quality**:

- [ ] All skills have individual files
- [ ] Each skill file has 8 required sections
- [ ] Workflow steps are numbered and clear
- [ ] Examples show input → process → output
- [ ] Validation checklist per skill (5-8 items)
- [ ] Common pitfalls documented
- [ ] Best practices included
- [ ] Files are 1,000+ words each

**Integration Quality**:

- [ ] Compatible with previous agent (if applicable)
- [ ] Compatible with next agent (if applicable)
- [ ] Input validation skill exists (if needed)
- [ ] Output formatting skill exists (if needed)
- [ ] Handoff verification skill exists (if needed)
- [ ] Import paths documented
- [ ] Function signatures specified
- [ ] File locations defined

**Documentation Quality**:

- [ ] README.md created
- [ ] FINAL_REVIEW_AND_IMPROVEMENTS.md created
- [ ] All files in correct directory structure
- [ ] Naming conventions followed
- [ ] Cross-references work (links between files)

**Testing Quality**:

- [ ] Tested with AI (Claude/GPT-4)
- [ ] Basic functionality works
- [ ] Edge cases handled
- [ ] Integration tested (if applicable)
- [ ] All request patterns work
- [ ] Output format verified

**Overall Quality**:

- [ ] Agent has 5-15 skills
- [ ] At least 70% skills are production-ready
- [ ] Agent provides clear value
- [ ] Agent fills gap in workflow
- [ ] Agent maintains consistency with existing agents
- [ ] Agent is documented thoroughly

**Score Target**: 9.5/10 or higher

---

## 🎨 NAMING CONVENTIONS

### Agent Names

- **Format**: `[Purpose] Agent`
- **Examples**:
  - Analysis Agent
  - Integration Test Agent
  - Database Migration Agent
  - API Documentation Agent

### Master File Names

- **Format**: `[AGENT-NAME]_MASTER.md`
- **Convention**: UPPERCASE with underscores
- **Examples**:
  - `ANALYSIS_AGENT_MASTER.md`
  - `INTEGRATION_AGENT_MASTER.md`
  - `DATABASE_MIGRATION_AGENT_MASTER.md`

### Skill File Names

- **Format**: `[descriptive-kebab-case].md`
- **Convention**: lowercase with hyphens
- **Be descriptive**: Name should clearly indicate what skill does
- **Examples**:
  - `service-code-analysis.md`
  - `prisma-schema-deep-analysis.md`
  - `foreign-key-analysis.md`
  - `test-scenario-recommendation.md`
  - `integration-agent-handoff-preparation.md`

### Directory Names

- **Format**: `[agent-name]`
- **Convention**: lowercase with hyphens
- **Examples**:
  - `analysis-agent/`
  - `integration-agent/`
  - `database-migration-agent/`

---

## 📊 SKILL NUMBERING STRATEGIES

### Strategy 1: Start at 0 (Integration Agent pattern)

```
Skill 0: [Foundation skill]
Skill 1: [Core skill]
Skill 2: [Core skill]
...
Skill 15: [Advanced skill]
```

**Use when**: Agent is technical/engineering focused

### Strategy 2: Start at 1 (Analysis Agent pattern)

```
Skill 1: [Core skill]
Skill 2: [Core skill]
Skill 3: [Core skill]
...
Skill 10: [Advanced skill]
```

**Use when**: Agent is analytical/planning focused

### Strategy 3: Grouped numbering

```
Skills 1-5: Core capabilities
Skills 6-10: Advanced features
Skills 11-15: Integration & compatibility
```

**Use when**: Agent has distinct capability tiers

**Rule**: Be consistent within your agent. Sequential numbering (no gaps).

---

## 🎯 SKILL CATEGORIES & EXAMPLES

### Analysis Skills

- Code analysis
- Schema analysis
- Dependency analysis
- Pattern detection
- Complexity assessment

### Generation Skills

- Code generation
- Documentation generation
- Test generation
- Schema generation
- Config generation

### Validation Skills

- Input validation
- Output validation
- Compatibility validation
- Quality checking
- Error detection

### Transformation Skills

- Format conversion
- Data transformation
- Code refactoring
- Structure reorganization
- Translation

### Integration Skills

- Input preparation
- Output formatting
- Handoff verification
- Compatibility checking
- Protocol adherence

### Creative Skills

- Edge case detection
- Scenario generation
- Alternative solutions
- Innovation suggestions
- Problem anticipation

---

## 💡 EXAMPLES FROM OUR AGENTS

### Example 1: Analysis Agent

**Purpose**: Analyze service files and create test plans

**Skills** (10 total, 8 ready):

1. Service Code Analysis
2. Prisma Schema Deep Analysis
3. Foreign Key Analysis
4. [Future] Performance Profiling
5. Test Scenario Recommendation
6. [Future] Security Vulnerability Detection
7. Import & TypeScript Error Prevention
8. Creative Edge Case Detection
9. Test Plan Document Structure
10. Integration Agent Handoff Preparation

**Integration**:

- Receives: Service files from users
- Produces: Test plans for Integration Test Agent
- Handoff: Skill 10 ensures compatibility

**Key Feature**: Can analyze entire service OR specific methods

---

### Example 2: Integration Test Agent

**Purpose**: Implement integration tests from test plans

**Skills** (16 total, all ready): 0. Read Analysis Agent Test Plans

1. Import Statement Creation
2. Infrastructure Setup
3. Test Context Design
4. Prisma Schema Access
5. Database Test Implementation
6. Test Execution & Timing
7. Service Method Testing
8. Assertion & Validation
9. Test Error Handling
10. Test Memory Management
11. Memory Leak Prevention
12. Test Cleanup
13. Test Status Recording
14. Test File Organization
15. Production-Quality Testing

**Integration**:

- Receives: Test plans from Analysis Agent
- Produces: Test files for users
- Handoff: Skill 0 validates input format

**Key Feature**: Complete test implementation with infrastructure

---

## 🏗️ MASTER FILE TEMPLATE (COPY THIS)

```markdown
# 🎯 [AGENT NAME] - COMPLETE INSTRUCTION MANUAL

## ⚡ QUICK START

[2-3 sentences: what agent does, how to use it]

## 🤖 WHAT YOU ARE

You are the [Agent Name], an expert AI agent specialized in [domain].

**Your Core Competencies**:

- [Competency 1]
- [Competency 2]
- [Competency 3]

**Your Value**: [Value proposition]

**What You Don't Do**:

- [Boundary 1]
- [Boundary 2]

## 🔍 BEFORE YOU START: SELF-CHECK

Ask yourself:

1. [Critical question 1]?
2. [Critical question 2]?
3. [Critical question 3]?
4. [Critical question 4]?
5. [Critical question 5]?

If ANY answer is NO → Ask the user for clarification.

## 💼 YOUR CORE JOB

[Detailed job description - 2-4 paragraphs]

## 📊 YOUR SKILLS REFERENCE TABLE

| Skill # | Skill Name | File             | Status    | When to Use |
| ------- | ---------- | ---------------- | --------- | ----------- |
| 1       | [Name]     | skills/[file].md | ✅ Ready  | [Trigger]   |
| 2       | [Name]     | skills/[file].md | ✅ Ready  | [Trigger]   |
| 3       | [Name]     | skills/[file].md | 🚧 Future | [Trigger]   |

## 📋 REQUEST PATTERNS

### Pattern 1: [Name]

**When**: [Situation]
**Request**: "[Example request]"
**You Will**: [What you do]

### Pattern 2: [Name]

**When**: [Situation]
**Request**: "[Example request]"
**You Will**: [What you do]

## 🎯 THE RULES (NEVER BREAK THESE)

1. **ALWAYS** [rule]
2. **NEVER** [rule]
3. **MUST** [rule]
4. **DO NOT** [rule]
5. [More rules...]

## 🔄 YOUR WORKFLOW

**Step 1**: [Action]

- [Detail]

**Step 2**: [Action]

- [Detail]

**Step 3**: [Action]

- [Detail]

[Continue...]

## 📈 SKILL IMPLEMENTATION STATUS

### ✅ Production-Ready Skills (X/Y)

- Skill X: [Name]

### 🚧 Future Skills (X/Y)

- Skill X: [Name]

## YOUR [N] SKILLS

### Skill 1: [Name]

**File**: `skills/[file].md`
**Purpose**: [Description]
**When to Use**: [Triggers]

**Key Capabilities**:

- [Capability 1]
- [Capability 2]

---

[Repeat for all skills]

## 📤 OUTPUT TEMPLATE

\`\`\`markdown
[Show exact output structure]
\`\`\`

## 💡 EXAMPLES

### Example 1: [Scenario]

[Complete example]

### Example 2: [Scenario]

[Complete example]

## ✅ VALIDATION CHECKLIST

- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Check 3]
      [8-12 items total]

---

**Remember**: You are [Agent Name]. [Identity]. [Mission].
```

---

## 🚀 QUICK START: CREATE YOUR FIRST AGENT

### 30-Minute Agent Creation

**Step 1** (5 min): Define purpose, input, output
**Step 2** (5 min): List 5-8 required skills
**Step 3** (10 min): Create master file with all 13 sections
**Step 4** (5 min): Create 1-2 skill files (minimum viable)
**Step 5** (5 min): Test with AI

**Result**: Basic functional agent ready to improve!

### 2-Hour Agent Creation

**Phase 1** (30 min): Planning (purpose, skills, integration)
**Phase 2** (60 min): Master file + skill files (all skills)
**Phase 3** (20 min): Documentation (README, review)
**Phase 4** (10 min): Testing and validation

**Result**: Production-quality agent!

---

## ✅ FINAL CHECKLIST

Before considering agent complete:

**Planning**:

- [ ] Purpose clearly defined
- [ ] 5-15 skills identified
- [ ] Integration points mapped
- [ ] Input/output formats specified

**Master File**:

- [ ] All 13 sections present
- [ ] Skills reference table included
- [ ] Request patterns documented
- [ ] Rules clearly stated
- [ ] Workflow step-by-step
- [ ] Output template specific
- [ ] Examples realistic
- [ ] Validation checklist complete

**Skill Files**:

- [ ] All skills have files
- [ ] All files have 8 required sections
- [ ] Workflows are detailed
- [ ] Examples show complete scenarios
- [ ] Validation checklists included

**Integration**:

- [ ] Compatible with related agents
- [ ] Handoff skills created
- [ ] Format specifications clear
- [ ] Paths/signatures documented

**Documentation**:

- [ ] README.md created
- [ ] Review document created
- [ ] File structure correct
- [ ] Naming conventions followed

**Testing**:

- [ ] Tested with AI
- [ ] All patterns work
- [ ] Output format verified
- [ ] Integration tested

**Quality**:

- [ ] Score 9.5/10 or higher
- [ ] No critical gaps
- [ ] Consistent with other agents
- [ ] Ready for production

---

## 🎓 BEST PRACTICES

### 1. Start Simple, Iterate

- Create basic agent (5 skills)
- Test and validate
- Add more skills based on feedback

### 2. Learn from Existing Agents

- Read Analysis Agent master file
- Read Integration Agent master file
- Copy patterns that work

### 3. Focus on Integration

- Agents work together
- Output of Agent A = Input of Agent B
- Verify compatibility early

### 4. Write for AI, Not Humans

- Be explicit and detailed
- Use imperative commands
- Assume no prior knowledge

### 5. Test Early, Test Often

- Load to AI after each section
- Verify AI understands
- Catch issues immediately

### 6. Document Everything

- If you thought it, write it
- If it's important, emphasize it
- If it can fail, warn about it

### 7. Use Examples Liberally

- Show, don't just tell
- Complete examples (input → output)
- Realistic scenarios

### 8. Version Control

- Keep master file in git
- Track changes over time
- Learn from evolution

---

## 🎯 SUCCESS CRITERIA

Your agent is ready when:

1. ✅ AI can use it without additional explanation
2. ✅ It produces consistent, quality output
3. ✅ It integrates smoothly with other agents
4. ✅ Users can request work in natural language
5. ✅ Output matches specified format exactly
6. ✅ All skills work as documented
7. ✅ Edge cases handled gracefully
8. ✅ Documentation is complete
9. ✅ Quality score is 9.5/10 or higher
10. ✅ You're proud to ship it!

---

## 📚 ADDITIONAL RESOURCES

### Templates in This Repo

- `docs/agents/analysis-agent/` - Complete example
- `docs/agents/integration-agent/` - Complete example
- `docs/agents/STEP_BY_STEP_GUIDE.md` - Usage guide

### Suggested Reading

- Analysis Agent master file (best practices)
- Integration Agent master file (technical depth)
- Skill files (detailed workflows)

### Next Steps

1. Read both example agents completely
2. Choose what agent you want to create
3. Follow this template step-by-step
4. Test and iterate
5. Share and improve!

---

**You now have everything you need to create world-class AI agents!**

**Go build something amazing!** 🚀

---

**Document**: AGENT_CREATION_TEMPLATE.md  
**Purpose**: Complete blueprint for creating new agents  
**Audience**: Developers building additional agents  
**Version**: 1.0  
**Last Updated**: 2025-11-12  
**Created From**: Analysis Agent + Integration Test Agent patterns
