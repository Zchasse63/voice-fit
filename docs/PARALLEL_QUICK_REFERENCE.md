# Parallel Research API - Quick Reference

## 🚀 Quick Start

```bash
# Set API key
export PARALLEL_API_KEY="NSMbtmq6TkrQnRAuzvsJA-KoqpTuJa4yi7BDvjc3"

# Run test
cd /Users/zach/Desktop/VoiceFit
python3 test_parallel_integration.py
```

---

## 💰 Pricing Cheat Sheet

| Tier | Cost/Request | Use When |
|------|-------------|----------|
| lite | $0.005 | Quick lookups |
| base | $0.01 | Simple research |
| **core** ⭐ | **$0.025** | **Most research (DEFAULT)** |
| ultra | $0.30 | Deep research |

**100 queries/month with `core` = $2.50**

---

## 📝 Code Examples

### Research Injury Protocol

```python
from apps.backend.parallel_research import ParallelResearchService

service = ParallelResearchService()

result = service.research_injury_protocol(
    injury_name="rotator cuff tendinitis",
    body_part="shoulder",
    severity="moderate",
    processor="core"  # Optional, "core" is default
)

# Access results
print(result['content']['injury_summary'])
print(result['content']['recovery_timeline'])
print(result['content']['exercise_modifications'])
print(result['content']['red_flags'])
```

### Research Exercise Substitutions

```python
result = service.research_exercise_substitution(
    original_exercise="overhead press",
    injury_constraint="shoulder impingement",
    training_goal="strength",
    processor="core"  # Optional, "core" is default
)

# Access results
for sub in result['content']['substitutes']:
    print(f"{sub['exercise_name']}: {sub['effectiveness_rating']}/10")
    print(f"  Safety: {sub['injury_safety']}")
```

### Validate Recovery Timeline

```python
result = service.validate_recovery_timeline(
    injury_type="ACL tear",
    proposed_timeline_weeks=24,
    processor="core"  # Optional, "core" is default
)

# Access results
print(result['content']['timeline_assessment'])
print(result['content']['typical_range_weeks'])
```

---

## 🔧 Change Default Processor

Edit `apps/backend/parallel_research.py`:

```python
# Line 54
def research_injury_protocol(
    ...
    processor: str = "core"  # ← Change this
):

# Line 147
def research_exercise_substitution(
    ...
    processor: str = "core"  # ← Change this
):

# Line 210
def validate_recovery_timeline(
    ...
    processor: str = "core"  # ← Change this
):
```

---

## 📊 Output Structure

All results follow this pattern:

```json
{
  "content": {
    // Your structured data here
    "injury_summary": "...",
    "recovery_timeline": {...},
    "exercise_modifications": [...]
  },
  "basis": [
    {
      "field": "injury_summary",
      "reasoning": "...",
      "citations": [...],
      "confidence": "high"
    }
  ]
}
```

**Access data:** `result['content']['field_name']`
**Access citations:** `result['basis'][0]['citations']`

---

## ⚡ Common Tasks

### Batch Research Multiple Injuries

```python
injuries = [
    ("rotator cuff tendinitis", "shoulder", "moderate"),
    ("tennis elbow", "elbow", "mild"),
    ("patellar tendinitis", "knee", "moderate")
]

results = []
for injury, body_part, severity in injuries:
    result = service.research_injury_protocol(
        injury_name=injury,
        body_part=body_part,
        severity=severity
    )
    results.append(result)

# Save to file
import json
with open('injury_research.json', 'w') as f:
    json.dump(results, f, indent=2)
```

### Compare Processor Tiers

```python
# Test same query with different processors
query_params = {
    "injury_name": "shoulder impingement",
    "body_part": "shoulder",
    "severity": "moderate"
}

lite_result = service.research_injury_protocol(**query_params, processor="lite")
core_result = service.research_injury_protocol(**query_params, processor="core")
ultra_result = service.research_injury_protocol(**query_params, processor="ultra")

# Compare quality and detail
print(f"Lite fields: {len(lite_result['content'])}")
print(f"Core fields: {len(core_result['content'])}")
print(f"Ultra fields: {len(ultra_result['content'])}")
```

### Track Costs

```python
costs = {"lite": 0.005, "base": 0.01, "core": 0.025, "ultra": 0.30}

queries = [
    ("core", "injury protocol"),
    ("core", "exercise substitution"),
    ("base", "quick lookup"),
    ("ultra", "deep research")
]

total = sum(costs[processor] for processor, _ in queries)
print(f"Total cost: ${total:.2f}")
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not found" | `export PARALLEL_API_KEY="..."` |
| Results under 'content' | Expected: `result['content']['field']` |
| Query too slow | Use faster tier: `processor="base"` |
| Need more detail | Use higher tier: `processor="ultra"` |
| Repeated queries expensive | Caching is automatic (24hr) |

---

## 📚 Full Documentation

See `docs/PARALLEL_RESEARCH_GUIDE.md` for complete guide.

**API Docs:** https://docs.parallel.ai/task-api/task-deep-research

