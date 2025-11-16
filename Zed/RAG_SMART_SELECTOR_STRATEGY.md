# RAG Integration Strategy Using SmartNamespaceSelector

**Last Updated:** January 19, 2025  
**Status:** Revised strategy using existing SmartNamespaceSelector infrastructure  
**Impact:** Leverage existing sophisticated namespace selection vs hardcoded approach

---

## Executive Summary

**Discovery:** The project already has a sophisticated `SmartNamespaceSelector` that:
- Dynamically selects 15-25 namespaces based on input
- Uses priority levels (1=high, 2=medium, 3=low)
- Configures retrieval per namespace (top_k, content_types)
- Post-filters by content type (principle, exercise, programming, etc.)
- Adjusts semantic weights per namespace type
- Handles 41+ namespaces intelligently

**Previous Approach (Wrong):** Hardcoded namespaces per endpoint  
**Correct Approach:** Adapt SmartNamespaceSelector for each endpoint type

---

## SmartNamespaceSelector Capabilities

### What It Does

```python
# Input: Questionnaire/Context
questionnaire = {
    'primary_goal': 'strength and powerlifting',
    'experience_level': 'intermediate',
    'training_split': 'upper/lower',
    'injuries': ['lower back'],
    'weak_points': ['squat lockout'],
    'available_equipment': ['barbell', 'rack', 'bench']
}

# Output: Smart namespace selection
namespaces = selector.select_namespaces(questionnaire)
# Returns 15-25 namespaces with config:
# {
#   'strength-training': {
#     'top_k': 3,
#     'content_types': ['programming'],
#     'priority': 1
#   },
#   'injury-management': {
#     'top_k': 4,
#     'content_types': ['recovery', 'programming'],
#     'priority': 1
#   },
#   ...
# }

# Retrieves and formats context
context = selector.get_rag_context(questionnaire, max_chunks=50)
```

### Key Features

1. **Goal-Based Selection**
   - Strength → strength-training, powerlifting-programs, periodization-theory
   - Hypertrophy → hypertrophy, muscle-specific-programming, volume-management
   - General fitness → beginner-fundamentals, fitness-assessment

2. **Experience-Based Selection**
   - Beginner → beginner-fundamentals, movement-patterns, adherence
   - Advanced → autoregulation, periodization-concepts, fatigue-management

3. **Injury-Aware Selection**
   - Automatically adds injury-management, injury-prevention
   - Includes exercise-selection, equipment-substitution

4. **Priority System**
   - Priority 1 (high): 3-4 chunks per namespace
   - Priority 2 (medium): 2-3 chunks
   - Priority 3 (low): 1-2 chunks

5. **Content Type Filtering**
   - principle: Foundational concepts
   - exercise: Exercise-specific info
   - programming: Program design
   - recovery: Recovery protocols
   - concept: General concepts

6. **Semantic Weight Tuning**
   - 0.9 for conceptual namespaces (periodization, theory)
   - 0.6 for exercise-specific (technique, movements)
   - 0.8 for programming (templates, structure)
   - 0.75 default balanced

---

## How to Adapt SmartNamespaceSelector

### Core Pattern

```python
from smart_namespace_selector import SmartNamespaceSelector

# 1. Create selector instance
selector = SmartNamespaceSelector()

# 2. Build "questionnaire" from endpoint-specific data
questionnaire = build_questionnaire_for_endpoint(endpoint_data)

# 3. Get RAG context
context = selector.get_rag_context(questionnaire, max_chunks=30)

# 4. Use context in AI prompt
prompt = f"""
KNOWLEDGE BASE CONTEXT:
{context}

USER REQUEST:
{user_request}

Provide response using knowledge base.
"""
```

---

## Implementation by Endpoint Type

### 1. Program Generation (Already Works)

**File:** `program_generation_service.py`  
**Status:** ✅ Already using SmartNamespaceSelector

```python
# Current implementation
def generate_program(self, questionnaire: dict):
    selector = SmartNamespaceSelector()
    context = selector.get_rag_context(questionnaire, max_chunks=50)
    
    prompt = f"""
    {context}
    
    Generate program for: {questionnaire}
    """
```

**No changes needed** - this is the reference implementation!

---

### 2. Workout Insights

**File:** `main.py` → `/api/workout/insights`  
**Status:** ❌ Not using RAG

**Adaptation Strategy:**

```python
def build_questionnaire_for_insights(workout_data: dict, user_context: dict):
    """Convert workout data to questionnaire format"""
    questionnaire = {
        'primary_goal': 'fatigue assessment',  # Virtual goal
        'experience_level': user_context.get('experience_level', 'intermediate'),
        'training_split': user_context.get('training_split'),
        'injuries': user_context.get('active_injuries', []),
        'weak_points': [],
        'available_equipment': []
    }
    
    # Add virtual goals based on workout patterns
    if workout_data['volume'] > workout_data['avg_volume'] * 1.3:
        questionnaire['_context_hint'] = 'high_volume_overreaching'
    elif workout_data['performance_declined']:
        questionnaire['_context_hint'] = 'performance_plateau'
    
    return questionnaire

# In endpoint
selector = SmartNamespaceSelector()
questionnaire = build_questionnaire_for_insights(workout_data, user_context)
context = selector.get_rag_context(questionnaire, max_chunks=30)

# SmartNamespaceSelector will automatically select:
# - fatigue-management
# - recovery-and-performance
# - sticking-points (if plateau)
# - injury-management (if injuries present)
```

---

### 3. Chat Classification

**File:** `chat_classifier.py`  
**Status:** ❌ Not using RAG

**Adaptation Strategy:**

```python
def build_questionnaire_for_classification(message: str, user_context: dict):
    """Extract hints from message for namespace selection"""
    message_lower = message.lower()
    
    questionnaire = {
        'primary_goal': 'general',  # Default
        'experience_level': user_context.get('experience_level', 'intermediate'),
        'training_split': None,
        'injuries': user_context.get('active_injuries', []),
        'weak_points': [],
        'available_equipment': []
    }
    
    # Detect goal from message
    if any(word in message_lower for word in ['strength', 'powerlifting', 'strong']):
        questionnaire['primary_goal'] = 'strength'
    elif any(word in message_lower for word in ['muscle', 'size', 'hypertrophy', 'bodybuilding']):
        questionnaire['primary_goal'] = 'hypertrophy'
    elif any(word in message_lower for word in ['pain', 'injury', 'hurt']):
        questionnaire['primary_goal'] = 'injury management'
    
    return questionnaire

# In chat_classifier
selector = SmartNamespaceSelector()
questionnaire = build_questionnaire_for_classification(message, user_context)

# Get quick RAG context (fewer chunks for classification)
context = selector.get_rag_context(questionnaire, max_chunks=10)

# Use in classification prompt
prompt = f"""
RELEVANT KNOWLEDGE:
{context}

USER MESSAGE: {message}

Classify intent: workout_log, question, exercise_swap, onboarding, general
"""
```

---

### 4. Running Analysis

**File:** `main.py` → `/api/running/analyze`  
**Status:** ❌ Not using RAG

**Adaptation Strategy:**

```python
def build_questionnaire_for_running(run_data: dict, user_context: dict):
    """Convert running data to questionnaire format"""
    questionnaire = {
        'primary_goal': 'cardio and running',  # Triggers running-cardio namespace
        'experience_level': user_context.get('running_experience', 'beginner'),
        'training_split': None,
        'injuries': user_context.get('active_injuries', []),
        'weak_points': [],
        'available_equipment': []
    }
    
    # Add context hints
    if run_data.get('pace_decline'):
        questionnaire['_context_hint'] = 'fatigue_analysis'
    if run_data.get('distance') > user_context.get('typical_distance', 0) * 1.5:
        questionnaire['_context_hint'] = 'overreaching_risk'
    
    return questionnaire

# SmartNamespaceSelector will select:
# - running-cardio
# - cardio-conditioning
# - running-injuries (if injuries)
# - recovery-and-performance
# - fatigue-management
```

---

### 5. Onboarding

**File:** `onboarding_service.py`  
**Status:** ❌ Not using RAG

**Adaptation Strategy:**

```python
def build_questionnaire_for_onboarding(message: str, current_progress: dict):
    """Build questionnaire from onboarding conversation"""
    questionnaire = {
        'primary_goal': current_progress.get('detected_goal', 'general fitness'),
        'experience_level': current_progress.get('experience_level', 'beginner'),
        'training_split': None,
        'injuries': current_progress.get('injuries', []),
        'weak_points': [],
        'available_equipment': current_progress.get('equipment', [])
    }
    
    return questionnaire

# SmartNamespaceSelector will prioritize:
# - beginner-fundamentals (if beginner)
# - fitness-assessment
# - training-fundamentals
# - equipment-appropriate namespaces
```

---

### 6. Fatigue Analytics

**File:** `fatigue_monitoring_service.py`  
**Status:** ❌ Not using RAG

**Adaptation Strategy:**

```python
def build_questionnaire_for_fatigue(user_id: str, fatigue_data: dict):
    """Build questionnaire for fatigue assessment"""
    questionnaire = {
        'primary_goal': 'fatigue management',  # Virtual goal
        'experience_level': get_user_experience(user_id),
        'training_split': get_user_split(user_id),
        'injuries': get_active_injuries(user_id),
        'weak_points': [],
        'available_equipment': []
    }
    
    # Context hints
    if fatigue_data['fatigue_level'] > 7:
        questionnaire['_context_hint'] = 'high_fatigue'
    
    return questionnaire

# SmartNamespaceSelector will select:
# - fatigue-management (priority 1)
# - recovery-and-performance (priority 1)
# - autoregulation (priority 2)
# - periodization-concepts (priority 2)
```

---

### 7. Deload Recommendations

**File:** `deload_recommendation_service.py`  
**Status:** ❌ Not using RAG

**Adaptation Strategy:**

```python
def build_questionnaire_for_deload(user_id: str, training_data: dict):
    """Build questionnaire for deload recommendation"""
    questionnaire = {
        'primary_goal': 'periodization and recovery',
        'experience_level': get_user_experience(user_id),
        'training_split': get_user_split(user_id),
        'injuries': get_active_injuries(user_id),
        'weak_points': [],
        'available_equipment': []
    }
    
    return questionnaire

# SmartNamespaceSelector will select:
# - periodization-theory (priority 1)
# - periodization-concepts (priority 1)
# - fatigue-management (priority 1)
# - recovery-and-performance (priority 2)
```

---

## Enhanced SmartNamespaceSelector (If Needed)

### Option A: Add Virtual Goals

Extend `select_namespaces()` to handle virtual goals:

```python
# In select_namespaces() method
goal = questionnaire.get('primary_goal', '').lower()

# Add support for virtual goals
if 'fatigue' in goal:
    selected['fatigue-management'] = {'top_k': 4, 'content_types': ['programming', 'recovery'], 'priority': 1}
    selected['recovery-and-performance'] = {'top_k': 3, 'content_types': ['recovery'], 'priority': 1}
    selected['autoregulation'] = {'top_k': 3, 'content_types': ['programming'], 'priority': 1}

if 'periodization' in goal or 'deload' in goal:
    selected['periodization-theory'] = {'top_k': 4, 'content_types': ['principle'], 'priority': 1}
    selected['periodization-concepts'] = {'top_k': 3, 'content_types': ['principle'], 'priority': 1}
    selected['recovery-protocols'] = {'top_k': 2, 'content_types': ['recovery'], 'priority': 2}

if 'injury' in goal:
    selected['injury-analysis'] = {'top_k': 4, 'content_types': ['recovery'], 'priority': 1}
    selected['injury-prevention'] = {'top_k': 3, 'content_types': ['principle'], 'priority': 1}
    selected['injury-management'] = {'top_k': 3, 'content_types': ['recovery', 'programming'], 'priority': 1}

if 'cardio' in goal or 'running' in goal:
    selected['running-cardio'] = {'top_k': 4, 'content_types': ['programming'], 'priority': 1}
    selected['cardio-conditioning'] = {'top_k': 3, 'content_types': ['programming'], 'priority': 1}
    selected['running-injuries'] = {'top_k': 2, 'content_types': ['recovery'], 'priority': 2}
```

### Option B: Add Context Hints

Support `_context_hint` in questionnaire:

```python
# In select_namespaces() method
context_hint = questionnaire.get('_context_hint', '')

if context_hint == 'high_volume_overreaching':
    selected['fatigue-management'] = {'top_k': 4, 'content_types': ['programming', 'recovery'], 'priority': 1}
    selected['recovery-and-performance'] = {'top_k': 3, 'content_types': ['recovery'], 'priority': 1}

if context_hint == 'performance_plateau':
    selected['sticking-points'] = {'top_k': 4, 'content_types': ['programming'], 'priority': 1}
    selected['autoregulation'] = {'top_k': 3, 'content_types': ['programming'], 'priority': 1}
```

---

## Implementation Checklist

### Phase 1: Extend SmartNamespaceSelector (2-3 hours)
- [ ] Add virtual goal support (fatigue, injury, cardio, deload)
- [ ] Add context hint support
- [ ] Add query building helpers for each endpoint type
- [ ] Test with various inputs

### Phase 2: Integrate into Endpoints (8-10 hours)

**Critical (Day 1-2):**
- [ ] Workout Insights (1-2 hours)
- [ ] Chat Classification (1 hour)
- [ ] Running Analysis (1-2 hours)
- [ ] Onboarding (1-2 hours)

**Medium Priority (Day 3-4):**
- [ ] Fatigue Analytics (1 hour)
- [ ] Deload Recommendations (1 hour)
- [ ] Exercise Explanations (1 hour)
- [ ] Exercise Substitutes (1 hour)

**Low Priority (Day 5):**
- [ ] Running Parse (30 min)
- [ ] Program Generation - Running (already works, just verify)
- [ ] Remaining exercise endpoints (2-3 hours)

### Phase 3: Testing & Optimization (2-3 hours)
- [ ] Test each endpoint with RAG
- [ ] Verify namespace selection makes sense
- [ ] Benchmark retrieval latency (<400ms target)
- [ ] Validate AI response quality improvement

---

## Code Templates

### Template 1: Add RAG to Service Class

```python
# At top of file
from smart_namespace_selector import SmartNamespaceSelector

class MyService:
    def __init__(self):
        self.selector = SmartNamespaceSelector()
    
    def my_method(self, user_data: dict):
        # Build questionnaire
        questionnaire = self._build_questionnaire(user_data)
        
        # Get RAG context
        context = self.selector.get_rag_context(questionnaire, max_chunks=30)
        
        # Use in prompt
        prompt = f"""
        KNOWLEDGE BASE:
        {context}
        
        USER DATA:
        {user_data}
        
        Provide recommendation.
        """
        
        return call_ai_with_prompt(prompt)
    
    def _build_questionnaire(self, user_data: dict) -> dict:
        return {
            'primary_goal': self._extract_goal(user_data),
            'experience_level': user_data.get('experience', 'intermediate'),
            'injuries': user_data.get('injuries', []),
            # ... etc
        }
```

### Template 2: Add RAG to Endpoint Function

```python
# In main.py
from smart_namespace_selector import SmartNamespaceSelector

@app.post("/api/my-endpoint")
async def my_endpoint(request: MyRequest):
    # Build questionnaire
    questionnaire = {
        'primary_goal': request.goal,
        'experience_level': request.experience,
        'injuries': request.injuries or [],
    }
    
    # Get RAG context
    selector = SmartNamespaceSelector()
    context = selector.get_rag_context(questionnaire, max_chunks=30)
    
    # Use in AI call
    prompt = f"""
    {context}
    
    {request.data}
    """
    
    response = await call_ai(prompt)
    return response
```

---

## Benefits of This Approach

### vs Hardcoded Namespaces

**Before (Hardcoded):**
```python
# Rigid, doesn't adapt
namespaces = ['programming', 'periodization', 'strength-training']
```

**After (SmartNamespaceSelector):**
```python
# Adapts based on user context
questionnaire = build_from_user_data(user_data)
namespaces = selector.select_namespaces(questionnaire)
# Automatically adds injury-management if injuries present
# Automatically selects beginner-fundamentals if beginner
# Automatically adjusts priorities
```

### Key Advantages

1. **Dynamic Selection** - Adapts to user context automatically
2. **Priority System** - Retrieves more from high-priority namespaces
3. **Content Type Filtering** - Gets programming vs principle vs exercise as needed
4. **Semantic Weight Tuning** - Optimizes search per namespace type
5. **Built-in Best Practices** - Already optimized from program generation
6. **Maintainable** - Single place to update namespace logic
7. **Scalable** - Easy to add new virtual goals or context hints

---

## Success Metrics

### Before RAG Integration
- Program generation: Uses RAG ✅
- Other 15+ endpoints: No RAG ❌

### After RAG Integration
- All endpoints use SmartNamespaceSelector ✅
- Dynamic namespace selection ✅
- Better AI response quality (30-40% improvement) ✅
- Evidence-based recommendations ✅
- Reduced hallucinations ✅

### Performance Targets
- RAG retrieval: < 400ms per endpoint
- Total latency increase: < 500ms
- Context relevance: > 90% (measured by AI quality)

---

## Timeline

**Day 1 (4-5 hours):**
- Extend SmartNamespaceSelector with virtual goals
- Add context hint support
- Test enhancements

**Day 2-3 (8-10 hours):**
- Integrate into critical endpoints (5 endpoints)
- Test each integration
- Verify namespace selection

**Day 4-5 (6-8 hours):**
- Integrate into remaining endpoints (10 endpoints)
- Full testing
- Performance optimization

**Total: 18-23 hours** (much less than 28-35 hours with hardcoded approach!)

---

## Next Steps

1. **Extend SmartNamespaceSelector** with virtual goals (2-3 hours)
2. **Start with highest impact**: Workout Insights (1-2 hours)
3. **Continue systematically** through all endpoints
4. **Test and validate** each integration

**Result:** All endpoints using sophisticated RAG with SmartNamespaceSelector! 🚀