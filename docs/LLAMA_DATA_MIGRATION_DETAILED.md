# Llama 3.3 70B Data Migration - Detailed Guide

**Categories 1 & 2: Voice Parsing + Knowledge Base Extraction**

---

## Overview

This document explains **exactly** how to convert your existing GPT-4o Mini training data (3,890 voice parsing examples + 23 knowledge base chunks) into Llama 3.3 70B format with enhanced reasoning capabilities.

---

## CATEGORY 1: Voice Parsing Migration (3,890 examples)

### **Current Format (GPT-4o Mini - OpenAI JSONL)**

Your existing data looks like this:

```jsonl
{
  "messages": [
    {
      "role": "system",
      "content": "You are a voice command parser for workout logging.\nParse the user's voice transcript into structured exercise data.\n\nOutput format (JSON):\n{\n    \"exercise_id\": <int>,\n    \"exercise_name\": <string>,\n    \"weight\": <float or null>,\n    \"weight_unit\": \"lbs\" or \"kg\",\n    \"reps\": <int or null>,\n    \"duration_seconds\": <int or null>,\n    \"rpe\": <int 1-10 or null>,\n    \"rir\": <int or null>,\n    \"tempo\": <string or null>,\n    \"rest_seconds\": <int or null>,\n    \"notes\": <string or null>,\n    \"confidence\": <float 0.0-1.0>\n}"
    },
    {
      "role": "user",
      "content": "bench press 225 for 8 at RPE 8"
    },
    {
      "role": "assistant",
      "content": "{\"exercise_id\": \"abc123\", \"exercise_name\": \"Barbell Bench Press\", \"weight\": 225, \"weight_unit\": \"lbs\", \"reps\": 8, \"rpe\": 8, \"rir\": 2, \"confidence\": 0.95}"
    }
  ]
}
```

---

### **Target Format (Llama 3.3 70B - Enhanced with Reasoning)**

**Option A: Basic Conversion (Minimal Changes)**

```jsonl
{
  "messages": [
    {
      "role": "system",
      "content": "You are a voice command parser for workout logging. Parse the user's voice transcript into structured exercise data.\n\nOutput format (JSON):\n{\n    \"exercise_id\": <string>,\n    \"exercise_name\": <string>,\n    \"weight\": <float or null>,\n    \"weight_unit\": \"lbs\" or \"kg\",\n    \"reps\": <int or null>,\n    \"rpe\": <int or null>,\n    \"rir\": <int or null>,\n    \"confidence\": <float 0.0-1.0>\n}"
    },
    {
      "role": "user",
      "content": "bench press 225 for 8 at RPE 8"
    },
    {
      "role": "assistant",
      "content": "{\"exercise_id\": \"abc123\", \"exercise_name\": \"Barbell Bench Press\", \"weight\": 225, \"weight_unit\": \"lbs\", \"reps\": 8, \"rpe\": 8, \"rir\": 2, \"confidence\": 0.95}"
    }
  ]
}
```

**Changes:**
- ✅ Same structure (system/user/assistant)
- ✅ Simplified output schema (removed unused fields like tempo, rest_seconds, duration_seconds)
- ✅ No reasoning chains (keeps it simple)

**Pros:** Fast, minimal work, preserves existing accuracy  
**Cons:** Doesn't leverage Llama 3.3's reasoning capabilities

---

**Option B: Enhanced with Reasoning Chains (RECOMMENDED)**

```jsonl
{
  "messages": [
    {
      "role": "system",
      "content": "You are a voice command parser for workout logging. Parse the user's voice transcript into structured exercise data.\n\nYou must provide:\n1. Reasoning chain showing your parsing logic\n2. Structured JSON output\n\nOutput format:\n{\n    \"reasoning\": [<array of reasoning steps>],\n    \"parsed_data\": {\n        \"exercise_id\": <string>,\n        \"exercise_name\": <string>,\n        \"weight\": <float or null>,\n        \"weight_unit\": \"lbs\" or \"kg\",\n        \"reps\": <int or null>,\n        \"rpe\": <int or null>,\n        \"rir\": <int or null>,\n        \"confidence\": <float 0.0-1.0>,\n        \"confidence_reasoning\": <string>\n    }\n}"
    },
    {
      "role": "user",
      "content": "bench press 225 for 8 at RPE 8"
    },
    {
      "role": "assistant",
      "content": "{\n  \"reasoning\": [\n    \"Input contains 'bench press' - common exercise name\",\n    \"'225' appears before 'for' - indicates weight in pounds (US default)\",\n    \"'for 8' indicates 8 repetitions\",\n    \"'at RPE 8' indicates Rate of Perceived Exertion of 8/10\",\n    \"RPE 8 typically means 2 reps in reserve (RIR = 10 - RPE)\",\n    \"Exercise matches 'Barbell Bench Press' in database\",\n    \"All key fields extracted with high confidence\"\n  ],\n  \"parsed_data\": {\n    \"exercise_id\": \"abc123\",\n    \"exercise_name\": \"Barbell Bench Press\",\n    \"weight\": 225,\n    \"weight_unit\": \"lbs\",\n    \"reps\": 8,\n    \"rpe\": 8,\n    \"rir\": 2,\n    \"confidence\": 0.95,\n    \"confidence_reasoning\": \"Clear exercise name, explicit weight and reps, standard RPE notation - all fields unambiguous\"\n  }\n}"
    }
  ]
}
```

**Changes:**
- ✅ Added `reasoning` array showing parsing logic
- ✅ Added `confidence_reasoning` explaining why confidence is 0.95
- ✅ Nested `parsed_data` to separate reasoning from output
- ✅ Leverages Llama 3.3's chain-of-thought capabilities

**Pros:** Better model understanding, more transparent, easier to debug  
**Cons:** More tokens per example (~30% increase), requires regenerating assistant responses

---

### **Migration Strategy: 3 Approaches**

#### **Approach 1: Direct Conversion (Fastest - 2-4 hours)**

**What:** Convert OpenAI format → Llama format with minimal changes

**Steps:**
1. Load `voice_training_data_final_merged.jsonl`
2. For each example:
   - Keep system/user/assistant structure
   - Simplify system prompt (remove unused fields)
   - Keep assistant response as-is
3. Save as `voice_parsing_llama_basic.jsonl`

**Python Script:**
```python
import json

def convert_basic(input_file, output_file):
    with open(input_file, 'r') as f_in, open(output_file, 'w') as f_out:
        for line in f_in:
            example = json.loads(line)
            
            # Simplify system prompt
            system_content = example['messages'][0]['content']
            # Remove unused fields from schema
            system_content = system_content.replace(
                '"duration_seconds": <int or null>,\n    ',
                ''
            ).replace(
                '"tempo": <string or null>,\n    ',
                ''
            ).replace(
                '"rest_seconds": <int or null>,\n    ',
                ''
            ).replace(
                '"notes": <string or null>,\n    ',
                ''
            )
            
            example['messages'][0]['content'] = system_content
            
            # Write to output
            f_out.write(json.dumps(example) + '\n')

convert_basic(
    'archive/fine-tuning/voice_training_data_final_merged.jsonl',
    'voice_parsing_llama_basic.jsonl'
)
```

**Pros:** Fast, low risk, preserves existing accuracy  
**Cons:** Doesn't leverage Llama 3.3's strengths

---

#### **Approach 2: LLM-Enhanced Conversion (Recommended - 1-2 days)**

**What:** Use GPT-4 or Claude to add reasoning chains to existing examples

**Steps:**
1. Load existing examples
2. For each example, use GPT-4/Claude to:
   - Analyze the user input
   - Generate reasoning chain
   - Add confidence reasoning
   - Restructure output
3. Save enhanced examples

**Python Script:**
```python
import json
from openai import OpenAI

client = OpenAI()

def enhance_with_reasoning(example):
    """Use GPT-4 to add reasoning chains to existing example"""
    
    user_input = example['messages'][1]['content']
    assistant_output = example['messages'][2]['content']
    
    prompt = f"""Given this voice parsing example:

User input: "{user_input}"
Parsed output: {assistant_output}

Generate a reasoning chain showing HOW you parsed this input. Format as JSON:
{{
  "reasoning": [
    "step 1...",
    "step 2...",
    ...
  ],
  "confidence_reasoning": "why this confidence level..."
}}

Be specific about:
- How you identified the exercise name
- How you extracted weight, reps, RPE
- Why you chose this confidence level
- Any ambiguities or assumptions
"""
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    
    reasoning_data = json.loads(response.choices[0].message.content)
    
    # Restructure assistant response
    parsed_data = json.loads(assistant_output)
    enhanced_output = {
        "reasoning": reasoning_data["reasoning"],
        "parsed_data": {
            **parsed_data,
            "confidence_reasoning": reasoning_data["confidence_reasoning"]
        }
    }
    
    # Update example
    example['messages'][2]['content'] = json.dumps(enhanced_output, indent=2)
    
    return example

# Process in batches
def convert_enhanced(input_file, output_file, batch_size=100):
    with open(input_file, 'r') as f_in:
        examples = [json.loads(line) for line in f_in]
    
    enhanced = []
    for i, example in enumerate(examples):
        print(f"Processing {i+1}/{len(examples)}...")
        enhanced.append(enhance_with_reasoning(example))
        
        # Save checkpoint every batch_size examples
        if (i + 1) % batch_size == 0:
            with open(output_file, 'w') as f_out:
                for ex in enhanced:
                    f_out.write(json.dumps(ex) + '\n')
    
    # Final save
    with open(output_file, 'w') as f_out:
        for ex in enhanced:
            f_out.write(json.dumps(ex) + '\n')

convert_enhanced(
    'archive/fine-tuning/voice_training_data_final_merged.jsonl',
    'voice_parsing_llama_enhanced.jsonl'
)
```

**Cost:** 3,890 examples × 500 tokens avg × $0.15/1M tokens = **~$0.30**

**Pros:** Leverages Llama 3.3's reasoning, better model understanding  
**Cons:** Takes longer, costs a bit more

---

#### **Approach 3: Hybrid (Best of Both - 4-8 hours)**

**What:** Basic conversion for simple examples, enhanced for complex/ambiguous ones

**Steps:**
1. Categorize examples by complexity:
   - **Simple** (80%): "bench press 225 for 8" → Basic conversion
   - **Complex** (20%): "same weight for 7 reps, felt easier" → Enhanced with reasoning
2. Apply appropriate conversion strategy
3. Merge results

**When to enhance:**
- Abbreviations (RDL, db, bb, OHP)
- Context references ("same weight", "last set")
- Ambiguous inputs ("chest press" - barbell or dumbbell?)
- Low confidence (<0.80)

**Pros:** Best balance of speed and quality  
**Cons:** Requires manual categorization

---

### **Recommendation: Approach 2 (LLM-Enhanced)**

**Why:**
- Llama 3.3 70B excels at reasoning - leverage it!
- Only costs ~$0.30 to enhance all 3,890 examples
- Takes 1-2 days but produces significantly better model
- Makes debugging easier (can see model's thought process)
- Aligns with injury analysis format (consistency across use cases)

---

## CATEGORY 2: Knowledge Base Extraction (23 chunks → ~150 examples)

### **Current Format (Supabase `knowledge_base` table)**

Example chunk:

```json
{
  "chunk_id": "equipment_sub_001_squat",
  "chunk_type": "substitution_rule",
  "category": "equipment_substitution",
  "title": "SQUAT PATTERN - EQUIPMENT ALTERNATIVES",
  "content": "SQUAT PATTERN - EQUIPMENT ALTERNATIVES\n\nFull Gym:\n- Back Squat (high-bar or low-bar)\n- Front Squat\n- Safety Bar Squat\n- Hack Squat Machine\n- Leg Press\n\nHome Gym (Barbell):\n- Back Squat\n- Front Squat\n- Zercher Squat\n\nHome Gym (Dumbbells Only):\n- Goblet Squat\n- Bulgarian Split Squat\n- Dumbbell Front Squat\n\nBodyweight Only:\n- Bodyweight Squat\n- Pistol Squat\n- Bulgarian Split Squat (bodyweight)\n\nProgression:\nBodyweight → Goblet → Barbell → Specialty Bars",
  "tags": ["equipment", "substitution", "squat", "alternatives", "progression"]
}
```

---

### **Target Format (Llama 3.3 70B Training Examples)**

**Convert each chunk into multiple Q&A examples:**

#### **Example 1: Direct Question**

```jsonl
{
  "messages": [
    {
      "role": "system",
      "content": "You are an AI strength training coach. Provide exercise recommendations based on available equipment and user goals."
    },
    {
      "role": "user",
      "content": "I only have dumbbells at home. What can I do instead of barbell squats?"
    },
    {
      "role": "assistant",
      "content": "{\n  \"reasoning\": [\n    \"User has dumbbells only - limited to dumbbell-based squat variations\",\n    \"Barbell squat is a compound lower body movement - need equivalent\",\n    \"Best dumbbell alternatives maintain squat pattern with similar muscle activation\",\n    \"Goblet squat is most direct substitute - similar ROM and loading pattern\",\n    \"Bulgarian split squats add unilateral work - beneficial for balance and addressing asymmetries\"\n  ],\n  \"recommendations\": [\n    {\n      \"exercise\": \"Goblet Squat\",\n      \"rationale\": \"Most direct barbell squat substitute with dumbbells - maintains bilateral squat pattern, allows progressive overload\",\n      \"sets_reps\": \"3-4 sets of 8-12 reps\",\n      \"progression\": \"Increase dumbbell weight by 5-10 lbs when you can complete 4x12 with good form\"\n    },\n    {\n      \"exercise\": \"Bulgarian Split Squat\",\n      \"rationale\": \"Unilateral variation - addresses muscle imbalances, requires less absolute load for same stimulus\",\n      \"sets_reps\": \"3 sets of 8-10 reps per leg\",\n      \"progression\": \"Start with bodyweight, add dumbbells when bodyweight becomes easy\"\n    },\n    {\n      \"exercise\": \"Dumbbell Front Squat\",\n      \"rationale\": \"Bilateral squat with dumbbells at shoulders - more quad-dominant like front squat\",\n      \"sets_reps\": \"3-4 sets of 8-12 reps\",\n      \"progression\": \"Increase weight gradually, focus on maintaining upright torso\"\n    }\n  ],\n  \"progression_path\": \"Start with bodyweight squats to master form → Goblet squats with light dumbbell → Increase weight progressively → Add Bulgarian split squats for variety and unilateral strength\"\n}"
    }
  ]
}
```

---

#### **Example 2: Contextual Question**

```jsonl
{
  "messages": [
    {
      "role": "system",
      "content": "You are an AI strength training coach. Provide exercise recommendations based on available equipment and user goals."
    },
    {
      "role": "user",
      "content": "I'm a beginner with only bodyweight. How do I progress to weighted squats?"
    },
    {
      "role": "assistant",
      "content": "{\n  \"reasoning\": [\n    \"User is beginner - prioritize form mastery before adding load\",\n    \"Bodyweight only currently - need progression path to weighted variations\",\n    \"Typical progression: bodyweight → goblet → barbell\",\n    \"Beginner should master 3x15-20 bodyweight squats before adding weight\"\n  ],\n  \"progression_plan\": [\n    {\n      \"phase\": \"Phase 1: Bodyweight Mastery (2-4 weeks)\",\n      \"exercise\": \"Bodyweight Squat\",\n      \"goal\": \"3 sets of 15-20 reps with perfect form\",\n      \"form_cues\": [\"Knees track over toes\", \"Chest up\", \"Depth to parallel or below\", \"Controlled tempo\"],\n      \"progression_criteria\": \"Can complete 3x20 with good form, no knee pain, no excessive fatigue\"\n    },\n    {\n      \"phase\": \"Phase 2: Light Load Introduction (4-6 weeks)\",\n      \"exercise\": \"Goblet Squat\",\n      \"starting_weight\": \"10-20 lb dumbbell\",\n      \"goal\": \"3-4 sets of 10-12 reps\",\n      \"progression\": \"Increase weight by 5 lbs every 1-2 weeks\",\n      \"progression_criteria\": \"Can complete 4x12 with 40-50 lb dumbbell\"\n    },\n    {\n      \"phase\": \"Phase 3: Barbell Introduction (ongoing)\",\n      \"exercise\": \"Barbell Back Squat\",\n      \"starting_weight\": \"Empty barbell (45 lbs) or lighter training bar\",\n      \"goal\": \"3 sets of 5-8 reps\",\n      \"progression\": \"Add 5-10 lbs per week (linear progression)\",\n      \"notes\": \"Consider getting form check from coach or experienced lifter\"\n    }\n  ],\n  \"timeline\": \"6-10 weeks from bodyweight to barbell squats, depending on individual progress and consistency\"\n}"
    }
  ]
}
```

---

### **Extraction Strategy**

#### **Step 1: Query All Chunks from Supabase**

```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get all knowledge base chunks
response = supabase.table('knowledge_base').select('*').execute()
chunks = response.data

print(f"Found {len(chunks)} knowledge base chunks")
```

---

#### **Step 2: Convert Each Chunk into Multiple Examples**

**Template for conversion:**

```python
def chunk_to_training_examples(chunk):
    """Convert a knowledge base chunk into 5-10 training examples"""
    
    chunk_type = chunk['chunk_type']
    category = chunk['category']
    content = chunk['content']
    
    if chunk_type == 'substitution_rule':
        return generate_substitution_examples(chunk)
    elif chunk_type == 'classification':
        return generate_classification_examples(chunk)
    elif chunk_type == 'algorithm':
        return generate_algorithm_examples(chunk)
    elif chunk_type == 'example':
        return generate_customization_examples(chunk)
    elif chunk_type == 'questionnaire_question':
        return generate_mvq_examples(chunk)
    else:
        return []
```

---

#### **Step 3: Use LLM to Generate Examples**

```python
def generate_substitution_examples(chunk):
    """Generate 3-5 Q&A examples from equipment substitution chunk"""
    
    prompt = f"""Given this knowledge base chunk about exercise substitutions:

Title: {chunk['title']}
Content:
{chunk['content']}

Generate 3-5 realistic user questions and detailed AI coach responses.

Each example should:
1. Include reasoning chain showing how you arrived at recommendations
2. Provide specific exercise alternatives with sets/reps/progression
3. Explain rationale for each recommendation
4. Include progression path when relevant

Format as JSONL with system/user/assistant messages.
"""
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    
    # Parse and return examples
    return parse_generated_examples(response.choices[0].message.content)
```

---

### **Expected Output from 23 Chunks**

| Chunk Category | Chunks | Examples per Chunk | Total Examples |
|----------------|--------|-------------------|----------------|
| MVQ (questionnaire) | 7 | 5-10 | ~50 |
| Experience classification | 4 | 10-15 | ~50 |
| Decision trees | 4 | 5-10 | ~30 |
| Equipment substitutions | 3 | 3-5 | ~12 |
| Injury modifications | 3 | 3-5 | ~12 |
| Customization examples | 2 | 2-3 | ~5 |
| **TOTAL** | **23** | | **~159** |

---

## Summary: Migration Checklist

### **Voice Parsing (3,890 examples)**

- [ ] Choose conversion approach (Basic, Enhanced, or Hybrid)
- [ ] Write conversion script
- [ ] Test on 10 examples
- [ ] Run full conversion
- [ ] Validate output format
- [ ] Spot-check 50 random examples for quality
- [ ] Save as `voice_parsing_llama.jsonl`

**Estimated time:** 1-2 days (if using LLM enhancement)  
**Estimated cost:** ~$0.30 (GPT-4o-mini for enhancement)

---

### **Knowledge Base (23 chunks → ~150 examples)**

- [ ] Query all chunks from Supabase
- [ ] Categorize chunks by type
- [ ] Write chunk-to-examples conversion functions
- [ ] Use GPT-4 to generate examples from each chunk
- [ ] Review generated examples for quality
- [ ] Merge all examples
- [ ] Save as `knowledge_base_llama.jsonl`

**Estimated time:** 4-8 hours  
**Estimated cost:** ~$2-5 (GPT-4 for generation)

---

### **Combined Output**

- [ ] Merge `voice_parsing_llama.jsonl` + `knowledge_base_llama.jsonl`
- [ ] Validate combined dataset
- [ ] Check for duplicates
- [ ] Verify distribution
- [ ] Save as `voicefit_existing_data_llama.jsonl` (~4,040 examples)

**Total time:** 2-3 days  
**Total cost:** ~$3-6

---

**Next:** Ready to create detailed conversion scripts?

