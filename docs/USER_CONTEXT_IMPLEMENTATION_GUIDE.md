# User Context Implementation Guide

**Purpose:** Ensure AI has full knowledge of user's training history, injuries, recovery status, and preferences for personalized coaching.

**Status:** ⚠️ **NOT CURRENTLY IMPLEMENTED** - AI has zero user context right now!

---

## Problem

Currently, when users ask the AI questions, the AI has **NO KNOWLEDGE** of:
- ❌ User's training history
- ❌ Current program
- ❌ Active injuries
- ❌ Recent workouts
- ❌ Recovery status (readiness scores)
- ❌ Weekly training volume
- ❌ Experience level
- ❌ Goals

**Result:** AI gives generic advice instead of personalized coaching!

---

## Solution

Inject user context into the **system prompt** of every AI API call.

### **Architecture:**

```
User Question
    ↓
Fetch User Data from Supabase
    ↓
Build Context String
    ↓
Inject into System Prompt
    ↓
Send to OpenAI/Llama
    ↓
Get Personalized Response
```

---

## Implementation Steps

### **Step 1: User Context Builder Service** ✅ CREATED

**File:** `apps/backend/user_context_builder.py`

**What it does:**
- Fetches user data from Supabase
- Builds formatted context string
- Returns ready-to-inject prompt text

**Usage:**
```python
from user_context_builder import UserContextBuilder

# Initialize
context_builder = UserContextBuilder(supabase_client)

# Build context for user
user_context = await context_builder.build_context(user_id="user-123")

# Result:
"""
**USER CONTEXT:**

**Training Profile:**
- Experience: beginner (8 months training)
- Tier: premium
- Goals: strength, muscle
- Age: 28

**Current Program:**
- Program: 5/3/1 for Beginners
- Week: 4 of 12
- Focus: strength

**Current Training Volume (This Week):**
- Bench Press: 12 sets
- Squat: 15 sets
- Deadlift: 9 sets
- Overhead Press: 9 sets

**Recent Workouts (Last 7 Days):**

**2025-01-06:**
  - Bench Press 3x8 @ 185lbs (RPE 8)
  - Barbell Row 3x10 @ 135lbs (RPE 7)
  - Face Pulls 3x15 @ 30lbs
  - Avg RPE: 7.5/10
  - Notes: "Felt good, slight shoulder fatigue"

**Active Injuries:**
- shoulder (mild): Clicking during bench press, no pain initially
  Reported: 2025-01-01 (5 days ago)
  Status: active

**Current Readiness (Today):**
- Sleep Quality: 7/10
- Soreness: 4/10
- Stress: 5/10
- Energy: 8/10
- Overall Readiness: 72/100

**Important:** Use this context to provide personalized advice...
"""
```

---

### **Step 2: Update Injury Analysis Endpoint** ⚠️ TODO

**File:** `apps/backend/main.py` (lines 320-408)

**Current Code:**
```python
@app.post("/api/injury/analyze")
async def injury_analyze(request: InjuryAnalyzeRequest, user: dict = Depends(verify_token)):
    # ... validation ...
    
    system_message = """You are a sports medicine AI assistant..."""
    
    user_message = f"""Analyze the following injury report...
    
    USER INPUT:
    "{request.user_notes}"
    
    CONTEXT:
    - User tier: {request.user_tier}
    - Recent exercises: {request.recent_exercises or 'Not provided'}
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ],
    )
```

**Updated Code:**
```python
from user_context_builder import UserContextBuilder

@app.post("/api/injury/analyze")
async def injury_analyze(request: InjuryAnalyzeRequest, user: dict = Depends(verify_token)):
    # ... validation ...
    
    # BUILD USER CONTEXT
    context_builder = UserContextBuilder(supabase)
    user_context = await context_builder.build_context(user_id=request.user_id)
    
    # INJECT CONTEXT INTO SYSTEM PROMPT
    system_message = f"""You are a sports medicine AI assistant specializing in strength training injury analysis.

{user_context}

CRITICAL RULES:
1. Output ONLY valid JSON matching the exact schema provided
2. Be conservative - when uncertain, indicate lower confidence
3. Detect red flags requiring immediate medical attention
4. Distinguish between normal training soreness (DOMS) and actual injury
5. Never provide definitive diagnoses - only assessments and recommendations

SCOPE LIMITATIONS:
- You assess musculoskeletal training-related issues only
- You do NOT diagnose medical conditions
- You do NOT replace professional medical evaluation
- You recommend medical consultation for serious concerns"""
    
    user_message = f"""Analyze the following injury report from a strength training athlete.

USER INPUT:
"{request.user_notes}"

OUTPUT REQUIREMENTS:
Return a JSON object with this exact structure:
{{
  "injury_detected": boolean,
  "confidence": number (0.0-1.0),
  "body_part": string or null,
  "severity": "mild" | "moderate" | "severe" | null,
  ...
}}

Now analyze the user input and provide your assessment."""
    
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ],
    )
```

**Key Changes:**
1. ✅ Import `UserContextBuilder`
2. ✅ Build user context before AI call
3. ✅ Inject context into system prompt
4. ✅ Remove redundant context from user message (now in system prompt)

---

### **Step 3: Create AI Coach Endpoint** ⚠️ TODO

**File:** `apps/backend/main.py` (new endpoint)

**Add this endpoint:**
```python
from pydantic import BaseModel

class CoachQuestionRequest(BaseModel):
    user_id: str
    question: str
    conversation_history: Optional[List[Dict[str, str]]] = None

class CoachQuestionResponse(BaseModel):
    answer: str
    confidence: float

@app.post("/api/coach/ask", response_model=CoachQuestionResponse)
async def coach_ask(
    request: CoachQuestionRequest,
    user: dict = Depends(verify_token)
):
    """
    AI Coach Q&A endpoint with full user context.
    
    Provides personalized training advice based on user's:
    - Training history
    - Active injuries
    - Current program
    - Recovery status
    - Recent workouts
    """
    
    try:
        # Initialize OpenAI client
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # BUILD USER CONTEXT
        context_builder = UserContextBuilder(supabase)
        user_context = await context_builder.build_context(user_id=request.user_id)
        
        # BUILD SYSTEM PROMPT WITH CONTEXT
        system_prompt = f"""You are an expert strength training coach for VoiceFit. You provide evidence-based, practical advice on exercise form, programming, injury prevention, and training principles.

{user_context}

**Coaching Guidelines:**
1. **Personalize advice** - Use the user context above to tailor recommendations
2. **Be specific** - Reference their actual workouts, injuries, and program
3. **Be practical** - Give actionable steps, not just theory
4. **Be safe** - Consider their injuries and recovery status
5. **Be evidence-based** - Use proven training principles
6. **Be encouraging** - Support their progress and goals

**Response Format:**
- Use bullet points for clarity
- Include specific numbers (sets, reps, weights, percentages)
- Provide "why" explanations for recommendations
- Flag any safety concerns or red flags
- Suggest next steps or follow-up actions

**Tone:** Friendly, knowledgeable, supportive - like a personal coach who knows them well."""
        
        # BUILD MESSAGES ARRAY
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history if provided
        if request.conversation_history:
            messages.extend(request.conversation_history)
        
        # Add current question
        messages.append({"role": "user", "content": request.question})
        
        # CALL AI
        response = openai_client.chat.completions.create(
            model="ft:gpt-4o-mini-2024-07-18:personal:voice-fit-complete-v1:CYENuc9G",  # Use fine-tuned model
            messages=messages,
            temperature=0.7,  # Higher for conversational responses
            max_tokens=800,
        )
        
        answer = response.choices[0].message.content
        
        return CoachQuestionResponse(
            answer=answer,
            confidence=0.9  # Can calculate based on response quality
        )
        
    except Exception as e:
        print(f"Error in coach Q&A: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get coach response: {str(e)}"
        )
```

---

### **Step 4: Update Mobile CoachScreen** ⚠️ TODO

**File:** `apps/mobile/src/screens/CoachScreen.tsx`

**Current Code (lines 62-85):**
```typescript
const handleSend = () => {
  // ...
  // Simulate coach response
  setTimeout(() => {
    const coachResponse: Message = {
      text: 'AI coach responses will be implemented in Phase 5...',
      sender: 'coach',
    };
  }, 1000);
};
```

**Updated Code:**
```typescript
import { VoiceAPIClient } from '../services/voice/VoiceAPIClient';

const handleSend = async () => {
  if (!inputText.trim()) return;

  const newMessage: Message = {
    id: Date.now().toString(),
    text: inputText,
    sender: 'user',
    timestamp: new Date(),
  };

  setMessages([...messages, newMessage]);
  setInputText('');
  setIsLoading(true);

  try {
    // Get user ID from auth context
    const userId = 'user-123'; // TODO: Get from auth context
    
    // Build conversation history (last 10 messages)
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    // Call AI Coach API
    const response = await fetch(`${API_BASE_URL}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`, // TODO: Get from auth context
      },
      body: JSON.stringify({
        user_id: userId,
        question: inputText,
        conversation_history: conversationHistory,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get coach response');
    }
    
    const data = await response.json();
    
    const coachResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: data.answer,
      sender: 'coach',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, coachResponse]);
  } catch (error) {
    console.error('Error getting coach response:', error);
    
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Sorry, I encountered an error. Please try again.',
      sender: 'coach',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};
```

---

## Database Schema Requirements

### **Tables Needed:**

1. ✅ **`injury_logs`** - Already created
2. ⚠️ **`user_profiles`** - TODO: Create
3. ⚠️ **`workouts`** - TODO: Create
4. ⚠️ **`workout_exercises`** - TODO: Create
5. ⚠️ **`readiness_logs`** - TODO: Create
6. ⚠️ **`user_programs`** - TODO: Create

### **`user_profiles` Schema:**
```sql
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    training_age TEXT, -- e.g., "8 months", "2 years"
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
    goals TEXT[], -- e.g., ['strength', 'muscle', 'endurance']
    age INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Testing

### **Test User Context Builder:**
```python
# Test script
from user_context_builder import UserContextBuilder
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
context_builder = UserContextBuilder(supabase)

user_context = await context_builder.build_context(user_id="test-user-123")
print(user_context)
```

### **Test AI Coach Endpoint:**
```bash
curl -X POST http://localhost:8000/api/coach/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "test-user-123",
    "question": "My shoulder hurts after bench press. Should I keep training?"
  }'
```

---

## Summary

### **Current Status:**
- ❌ AI has **ZERO user context**
- ❌ Gives generic advice
- ❌ Doesn't know about injuries, program, or recovery

### **After Implementation:**
- ✅ AI has **FULL user context**
- ✅ Gives **personalized advice**
- ✅ Considers injuries, volume, recovery, experience
- ✅ References actual workouts and program

### **Next Steps:**
1. ✅ Create `UserContextBuilder` service (DONE)
2. ⚠️ Update `/api/injury/analyze` endpoint
3. ⚠️ Create `/api/coach/ask` endpoint
4. ⚠️ Update `CoachScreen.tsx` to call API
5. ⚠️ Create missing database tables
6. ⚠️ Test with real user data

---

**This is CRITICAL for VoiceFit to provide truly personalized AI coaching!** 🚀

