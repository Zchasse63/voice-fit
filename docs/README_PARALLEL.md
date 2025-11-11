# Parallel Deep Research API - Documentation Index

## 📚 Documentation Overview

This folder contains all documentation for using the Parallel Deep Research API for VoiceFit internal research.

---

## 📖 Available Documents

### 1. **[PARALLEL_RESEARCH_GUIDE.md](./PARALLEL_RESEARCH_GUIDE.md)** - Complete Guide
**Read this first!** Comprehensive guide covering:
- Overview and setup
- Detailed pricing breakdown
- All available research methods
- How to use the API
- How to adjust processor tiers
- Cost management strategies
- Best practices
- Troubleshooting

**Best for:** First-time users, comprehensive reference

---

### 2. **[PARALLEL_QUICK_REFERENCE.md](./PARALLEL_QUICK_REFERENCE.md)** - Cheat Sheet
Quick reference for common tasks:
- Pricing table
- Code snippets
- Common tasks
- Troubleshooting quick fixes

**Best for:** Quick lookups, copy-paste code examples

---

## 🚀 Getting Started

### Step 1: Set API Key
```bash
export PARALLEL_API_KEY="NSMbtmq6TkrQnRAuzvsJA-KoqpTuJa4yi7BDvjc3"
```

### Step 2: Run Test
```bash
cd /Users/zach/Desktop/VoiceFit
python3 test_parallel_integration.py
```

### Step 3: Try Examples
```bash
python3 research_examples.py
```

### Step 4: Start Researching!
```python
from apps.backend.parallel_research import ParallelResearchService

service = ParallelResearchService()

result = service.research_injury_protocol(
    injury_name="rotator cuff tendinitis",
    body_part="shoulder",
    severity="moderate"
)

print(result['content']['injury_summary'])
```

---

## 💰 Quick Pricing Reference

| Processor | Cost/Request | Best For |
|-----------|-------------|----------|
| lite | $0.005 | Quick lookups |
| base | $0.01 | Simple research |
| **core** ⭐ | **$0.025** | **Most research (DEFAULT)** |
| ultra | $0.30 | Deep research |

**Current default: `core` ($0.025 per request)**

---

## 📁 File Structure

```
VoiceFit/
├── apps/backend/
│   └── parallel_research.py          # Main API service
├── docs/
│   ├── README_PARALLEL.md             # This file
│   ├── PARALLEL_RESEARCH_GUIDE.md     # Complete guide
│   └── PARALLEL_QUICK_REFERENCE.md    # Quick reference
├── test_parallel_integration.py       # Test script
└── research_examples.py               # Example scripts
```

---

## 🎯 Common Use Cases

### Research an Injury Protocol
```python
service.research_injury_protocol(
    injury_name="tennis elbow",
    body_part="elbow",
    severity="mild"
)
```

### Find Exercise Substitutions
```python
service.research_exercise_substitution(
    original_exercise="squat",
    injury_constraint="knee pain",
    training_goal="strength"
)
```

### Validate Recovery Timeline
```python
service.validate_recovery_timeline(
    injury_type="ACL tear",
    proposed_timeline_weeks=24
)
```

---

## 🔧 Adjusting the Default Processor

**Current default:** `core` ($0.025 per request)

To change the default, edit `apps/backend/parallel_research.py`:

```python
# Line 54
processor: str = "core"  # ← Change to "base", "ultra", etc.

# Line 147
processor: str = "core"  # ← Change to "base", "ultra", etc.

# Line 210
processor: str = "core"  # ← Change to "base", "ultra", etc.
```

Or override per-request:
```python
result = service.research_injury_protocol(
    injury_name="...",
    body_part="...",
    severity="...",
    processor="ultra"  # ← Override default
)
```

---

## 📊 What You Get

All research returns structured JSON with:

✅ **Structured data** - Predictable format
✅ **Citations** - Every claim backed by sources
✅ **Confidence scores** - Reliability assessment
✅ **Evidence quality** - High/medium/low ratings
✅ **Reasoning** - Why each recommendation was made

Example output structure:
```json
{
  "content": {
    "injury_summary": "...",
    "recovery_timeline": {...},
    "exercise_modifications": [...],
    "red_flags": [...],
    "evidence_quality": "..."
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

---

## 💡 Tips for Research Team

1. **Start with `core`** - Works for 90% of use cases
2. **Use caching** - Repeated queries within 24 hours are FREE
3. **Batch queries** - Research multiple injuries in one session
4. **Save results** - Export to JSON for later analysis
5. **Check citations** - Verify evidence quality in `basis` field

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| API key error | Set environment variable: `export PARALLEL_API_KEY="..."` |
| Can't find results | Access via `result['content']['field_name']` |
| Query too slow | Use faster tier: `processor="base"` |
| Need more detail | Use higher tier: `processor="ultra"` |

See [PARALLEL_RESEARCH_GUIDE.md](./PARALLEL_RESEARCH_GUIDE.md) for detailed troubleshooting.

---

## 📞 Support

1. Check the documentation in this folder
2. Review example scripts: `research_examples.py`
3. Check the test script: `test_parallel_integration.py`
4. Review the source code: `apps/backend/parallel_research.py`
5. Contact the development team

---

## 🔗 External Resources

- **Parallel API Docs:** https://docs.parallel.ai/task-api/task-deep-research
- **Parallel Pricing:** https://parallel.ai/pricing
- **Parallel Platform:** https://platform.parallel.ai

---

## 📝 Quick Start Checklist

- [ ] Set `PARALLEL_API_KEY` environment variable
- [ ] Run `test_parallel_integration.py` to verify setup
- [ ] Read `PARALLEL_RESEARCH_GUIDE.md` for full details
- [ ] Try `research_examples.py` to see examples
- [ ] Start researching!

---

**Last Updated:** 2025-11-07
**Default Processor:** `core` ($0.025 per request)
**API Key:** Set in environment variable `PARALLEL_API_KEY`

