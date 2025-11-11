# Parallel Deep Research API - VoiceFit Research Team Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [API Pricing & Processor Tiers](#api-pricing--processor-tiers)
4. [Available Research Methods](#available-research-methods)
5. [How to Use](#how-to-use)
6. [Adjusting the Processor Tier](#adjusting-the-processor-tier)
7. [Cost Management](#cost-management)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Parallel Deep Research API is an **internal research tool** for the VoiceFit team to conduct evidence-based research on:
- Injury rehabilitation protocols
- Exercise substitutions for injury constraints
- Recovery timeline validation
- Training methodology research

**Key Features:**
- ✅ **Structured JSON output** - Data comes back in a predictable format
- ✅ **Citations & confidence scores** - Every claim is backed by sources
- ✅ **24-hour caching** - Repeated queries are free
- ✅ **Predictable pricing** - Pay per request, not per token

**Current Default:** `core` processor ($0.025 per request)

---

## Quick Start

### 1. Set Up Environment Variable

```bash
export PARALLEL_API_KEY="NSMbtmq6TkrQnRAuzvsJA-KoqpTuJa4yi7BDvjc3"
```

Or add to your `.env` file:
```
PARALLEL_API_KEY=NSMbtmq6TkrQnRAuzvsJA-KoqpTuJa4yi7BDvjc3
```

### 2. Run a Simple Test

```bash
cd /Users/zach/Desktop/VoiceFit
python3 test_parallel_integration.py
```

This will run 3 test queries and show you the output format.

---

## API Pricing & Processor Tiers

**What is a "request"?** 
- ONE call to the API = ONE request
- Cost is **per request**, NOT per token
- Query length, output size, and schema complexity don't affect cost

### Processor Tier Comparison

| Processor | Cost/Request | Cost/1K Requests | Best For | Latency | Max Fields |
|-----------|-------------|------------------|----------|---------|------------|
| **lite** | $0.005 | $5 | Basic info retrieval | 5-60s | ~2 |
| **base** | $0.01 | $10 | Simple research | 15-100s | ~5 |
| **core** ⭐ | **$0.025** | **$25** | **Complex research (DEFAULT)** | 1-5min | ~10 |
| **core2x** | $0.05 | $50 | Very complex research | 2-5min | ~10 |
| **pro** | $0.10 | $100 | Exploratory research | 3-9min | ~20 |
| **ultra** | $0.30 | $300 | Extensive deep research | 5-25min | ~20 |
| **ultra2x** | $0.60 | $600 | Advanced deep research | 5-25min | ~25 |
| **ultra4x** | $1.20 | $1,200 | Advanced deep research | 8-30min | ~25 |
| **ultra8x** | $2.40 | $2,400 | Advanced deep research | 8-30min | ~25 |

⭐ **Recommended:** Use `core` for most research tasks (current default)

### Cost Examples

**100 research queries per month:**
- `lite`: $0.50/month
- `base`: $1.00/month
- `core`: **$2.50/month** ⭐
- `ultra`: $30.00/month

**1,000 research queries per month:**
- `lite`: $5/month
- `base`: $10/month
- `core`: **$25/month** ⭐
- `ultra`: $300/month

---

## Available Research Methods

### 1. `research_injury_protocol()`
Research evidence-based rehabilitation protocols for specific injuries.

**Returns:**
- Injury summary
- Exercise modifications (avoid/substitute pairs)
- Recovery timeline with phases
- Load reduction strategies
- Red flags requiring medical attention
- Evidence quality assessment

### 2. `research_exercise_substitution()`
Find evidence-based exercise alternatives for injury constraints.

**Returns:**
- List of substitute exercises
- Effectiveness ratings (1-10)
- Muscle groups targeted
- Injury safety explanations
- Biomechanical comparisons
- Research citations

### 3. `validate_recovery_timeline()`
Validate proposed recovery timelines against research.

**Returns:**
- Typical recovery range
- Timeline assessment (realistic/optimistic/conservative)
- Factors affecting recovery
- Recommendations for adjustment

---

## How to Use

### Method 1: Python Script (Recommended)

Create a file `research_query.py`:

```python
#!/usr/bin/env python3
import sys
import os
import json

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend'))

from parallel_research import ParallelResearchService

# Initialize service (reads PARALLEL_API_KEY from environment)
service = ParallelResearchService()

# Example 1: Research injury protocol
result = service.research_injury_protocol(
    injury_name="rotator cuff tendinitis",
    body_part="shoulder",
    severity="moderate"
    # processor="core" is the default
)

print(json.dumps(result, indent=2))

# Example 2: Research exercise substitutions
result = service.research_exercise_substitution(
    original_exercise="overhead press",
    injury_constraint="shoulder impingement",
    training_goal="strength"
    # processor="core" is the default
)

print(json.dumps(result, indent=2))

# Example 3: Validate recovery timeline
result = service.validate_recovery_timeline(
    injury_type="ACL tear",
    proposed_timeline_weeks=24
    # processor="core" is the default
)

print(json.dumps(result, indent=2))
```

Run it:
```bash
python3 research_query.py
```

### Method 2: Interactive Python

```python
from apps.backend.parallel_research import ParallelResearchService

service = ParallelResearchService()

# Quick injury research
result = service.research_injury_protocol(
    injury_name="tennis elbow",
    body_part="elbow",
    severity="mild"
)

# Access specific fields
print(result['content']['injury_summary'])
print(result['content']['recovery_timeline'])
print(result['content']['red_flags'])
```

---

## Adjusting the Processor Tier

### When to Use Different Tiers

**Use `lite` ($0.005) when:**
- Quick definition lookups
- Basic injury information
- Simple yes/no questions

**Use `base` ($0.01) when:**
- Standard exercise substitutions
- Basic recovery timelines
- General injury protocols

**Use `core` ($0.025) when:** ⭐ **DEFAULT**
- Detailed injury protocols
- Complex exercise substitutions
- Evidence quality assessment needed
- Multiple data points required

**Use `ultra` ($0.30+) when:**
- Comprehensive research reports
- Deep literature reviews
- Novel injury combinations
- Maximum detail and citations needed

### How to Change the Processor

Simply add the `processor` parameter to any method:

```python
# Use lite processor (faster, cheaper, less detail)
result = service.research_injury_protocol(
    injury_name="shin splints",
    body_part="lower leg",
    severity="mild",
    processor="lite"  # ← Change here
)

# Use ultra processor (slower, expensive, maximum detail)
result = service.research_injury_protocol(
    injury_name="complex shoulder instability",
    body_part="shoulder",
    severity="severe",
    processor="ultra"  # ← Change here
)
```

### Changing the Default Processor

To change the default from `core` to something else, edit `apps/backend/parallel_research.py`:

```python
# Line 54 - research_injury_protocol
processor: str = "core"  # ← Change "core" to "base", "ultra", etc.

# Line 147 - research_exercise_substitution  
processor: str = "core"  # ← Change "core" to "base", "ultra", etc.

# Line 210 - validate_recovery_timeline
processor: str = "core"  # ← Change "core" to "base", "ultra", etc.
```

---

## Cost Management

### Built-in Caching (FREE)

The service automatically caches results for **24 hours**. Repeated queries within 24 hours are **FREE**.

```python
# First call - costs $0.025 (core processor)
result1 = service.research_injury_protocol(
    injury_name="rotator cuff tendinitis",
    body_part="shoulder",
    severity="moderate"
)

# Second call (same query within 24 hours) - FREE!
result2 = service.research_injury_protocol(
    injury_name="rotator cuff tendinitis",
    body_part="shoulder",
    severity="moderate"
)
```

### Disable Caching

If you need fresh data every time:

```python
result = service._execute_research(
    query="Your research query here",
    schema=None,
    processor="core",
    use_cache=False  # ← Disable cache
)
```

### Track Your Costs

Add this to your script to track costs:

```python
processor_costs = {
    "lite": 0.005,
    "base": 0.01,
    "core": 0.025,
    "core2x": 0.05,
    "pro": 0.10,
    "ultra": 0.30,
    "ultra2x": 0.60,
    "ultra4x": 1.20,
    "ultra8x": 2.40
}

processor = "core"
num_queries = 10

total_cost = processor_costs[processor] * num_queries
print(f"Estimated cost: ${total_cost:.2f}")
```

---

## Best Practices

### 1. Start with `core`, adjust as needed
- Default `core` processor works for 90% of use cases
- Only upgrade to `ultra` if you need maximum detail
- Only downgrade to `base`/`lite` if speed matters more than quality

### 2. Use caching effectively
- Run the same query multiple times? Cache saves money
- Cache expires after 24 hours
- Different parameters = different cache entry

### 3. Be specific in your queries
- Good: "rotator cuff tendinitis, shoulder, moderate severity"
- Bad: "shoulder pain"

### 4. Review the output structure
- Results are nested under `result['content']`
- Citations are in `result['basis']`
- Confidence scores help assess reliability

### 5. Batch similar queries
- Research multiple injuries in one session
- Save results to JSON files for later analysis

---

## Troubleshooting

### Error: "PARALLEL_API_KEY must be provided"
**Solution:** Set the environment variable:
```bash
export PARALLEL_API_KEY="NSMbtmq6TkrQnRAuzvsJA-KoqpTuJa4yi7BDvjc3"
```

### Error: "create() missing 1 required keyword-only argument: 'processor'"
**Solution:** This was fixed. Make sure you're using the latest version of `parallel_research.py`

### Results are nested under 'content'
**Expected behavior.** Access data like this:
```python
result['content']['injury_summary']
result['content']['recovery_timeline']
```

### Query takes too long
**Solution:** Use a faster processor tier:
- `core` (1-5 min) → `base` (15-100s) → `lite` (5-60s)

### Need more detail in results
**Solution:** Use a higher processor tier:
- `core` → `pro` → `ultra` → `ultra2x` → `ultra4x` → `ultra8x`

---

## Support

For questions or issues:
1. Check this guide first
2. Review the test script: `test_parallel_integration.py`
3. Check the code: `apps/backend/parallel_research.py`
4. Contact the development team

**API Documentation:** https://docs.parallel.ai/task-api/task-deep-research

