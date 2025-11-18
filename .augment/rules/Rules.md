---
type: "agent_requested"
description: "Example description"
---

### Autonomous Work
**Keep Moving Forward**:
- Work through the entire task list without asking permission between tasks
- Only stop to ask questions when: truly blocked, need clarification on requirements, or major architectural decision needed
- "Should I continue?" is not needed - just continue
- Complete all related tasks in one go, then summarize once at the end

**Task Completion**:
- If a task list has 5 items, complete all 5 before stopping
- Handle expected errors and edge cases without asking
- Make reasonable decisions on minor implementation details

---

### Summary & Documentation
**Frequency**: Only summarize after completing 3+ related tasks or major milestones. Skip summaries for single-file edits.

**Code in Summaries/Planning**:
- NO full code blocks in summaries or planning
- Use brief snippets (2-5 lines max) or plain English descriptions

**Conciseness**: 
- 3-5 bullet points max, focus on WHAT changed and WHY
- No preambles, no obvious details
- If context >30% full, switch to terse mode

**Default**: Code first, explain only when asked or truly necessary.

---

### Testing
**Test Against Reality**:
- ALWAYS use real endpoints, databases, backends when available
- Only mock external/paid services or when absolutely necessary

**Test Integrity**:
- NEVER rewrite tests to pass - fix the CODE, not the test
- Failing test = broken functionality, find root cause
- Don't mask with setTimeout, broader try-catch, or loosened assertions

**Production Ready**: Test real workflows, error handling, edge cases.

---

### Database Operations
**Always Check First**:
- Query database state BEFORE any schema changes
- Use SHOW TABLES, DESCRIBE, etc.

**Semantic Search**:
- Different devs use different terminology
- "workouts" might be: exercises, training_sessions, fitness_logs, activities
- Review ALL tables to understand purpose, not just name matches
- Examine columns and relationships

**Workflow**:
1. Inspect current state
2. Understand existing tables semantically
3. Write ONLY the diff needed
4. Never create duplicates

---

### Dependencies & Project Structure
**Check Before Adding**:
- Review package.json/requirements.txt first
- Look for existing similar packages or native solutions
- Match existing project structure and naming conventions

**Avoid Duplication**:
- Check for existing utilities, helpers, components
- Different files may have similar logic (utils vs helpers vs lib)

---

### Environment & Configuration
- Review existing .env and config files before suggesting new ones
- Don't hardcode values that should be environment variables
- Verify configurations before proposing changes

---

### Error Handling & Debugging
- Show error, propose fix - skip the essay
- One solution at a time
- Remove debug statements once issue is resolved

---

### Refactoring & Code Reviews
- Don't narrate every change
- Show results, explain only non-obvious improvements
- Focus on issues during reviews, not praise