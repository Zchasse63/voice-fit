# VoiceFit: Greenfield Architecture Proposal

**If I Could Build It From Scratch**

*A senior architect's perspective on how to build VoiceFit with modern best practices, full type safety, and simplified operations.*

---

## Executive Summary

The current VoiceFit architecture works, but has accumulated technical debt:
- 230KB single `main.py` file with 129 endpoints
- Multiple AI providers with different integration patterns
- Type mismatches between Python backend and TypeScript frontend
- Complex offline sync with WatermelonDB
- Authentication disabled by default
- 3 separate frontend apps (mobile, web, dashboard)

**My proposed architecture prioritizes:**
1. **Type Safety End-to-End** - One type definition, used everywhere
2. **Simplicity** - Fewer moving parts, easier to maintain
3. **Developer Experience** - Fast iteration, clear contracts
4. **Offline-First** - Built into the foundation, not bolted on
5. **Cost Efficiency** - Consolidate services where possible

---

## Architecture Decision: The Big Choices

### Choice 1: Backend Language

| Option | Pros | Cons | My Choice |
|--------|------|------|-----------|
| **Python (FastAPI)** | Great for AI/ML, existing code | No type sharing with TS frontend | |
| **Node.js (TypeScript)** | Full-stack type safety, shared code | AI libraries less mature | ✅ |
| **Go** | Performance, simplicity | Different type system, AI gaps | |

**Decision: TypeScript/Node.js Backend**

Why? VoiceFit is 80% CRUD + API orchestration, 20% AI. The AI calls are HTTP requests to external services (xAI, Kimi) - no heavy ML processing locally. Full-stack TypeScript means:
- Single language across entire stack
- Shared types between frontend and backend
- Shared validation schemas (Zod)
- Easier hiring (one skill set)

### Choice 2: API Architecture

| Option | Pros | Cons | My Choice |
|--------|------|------|-----------|
| **REST** | Simple, well-understood | Manual type sync, over/under-fetching | |
| **GraphQL** | Flexible queries, type codegen | Complexity, N+1 problems | |
| **tRPC** | Full type safety, zero codegen | Tight coupling, TS-only | ✅ |

**Decision: tRPC**

Why? tRPC gives us:
- Automatic type inference from backend to frontend
- No API documentation to maintain (types ARE the docs)
- No code generation step
- Compile-time errors if API contract breaks
- Perfect for a TypeScript monorepo

### Choice 3: Database

| Option | Pros | Cons | My Choice |
|--------|------|------|-----------|
| **Supabase (PostgreSQL)** | Auth, realtime, edge functions | Vendor lock-in | ✅ |
| **PlanetScale (MySQL)** | Serverless, branching | No built-in auth | |
| **Neon (PostgreSQL)** | Serverless, branching | No built-in auth/realtime | |
| **Self-hosted PostgreSQL** | Full control | Operations burden | |

**Decision: Keep Supabase**

Why? Supabase provides:
- PostgreSQL with pgvector for embeddings
- Built-in auth (email, OAuth, magic links)
- Realtime subscriptions
- Row-level security
- Edge functions for webhooks
- Already works well, no reason to change

### Choice 4: Mobile Framework

| Option | Pros | Cons | My Choice |
|--------|------|------|-----------|
| **React Native (Expo)** | Large ecosystem, web support | Performance gaps | ✅ |
| **Flutter** | Great performance, single codebase | Dart language, separate types | |
| **Native (Swift/Kotlin)** | Best performance | Two codebases | |

**Decision: Keep Expo (with improvements)**

Why? Expo 53+ has closed most performance gaps. Key improvements:
- Use Expo Router (file-based routing) instead of React Navigation
- Use TanStack Query instead of manual state management
- Use Zustand only for truly global state (auth, theme)
- Better offline strategy with optimistic updates

### Choice 5: AI Services

| Current State | Proposed State |
|---------------|----------------|
| Grok 4 (xAI) - AI Coach, programs | Keep - best reasoning |
| Kimi K2 (Moonshot) - Voice parsing | Consolidate to Grok |
| OpenAI - Embeddings | Replace with local or Grok |
| Upstash Search - RAG | Keep - great for semantic search |

**Decision: Consolidate to 2 AI Services**
- **Grok 4** for all LLM tasks (coaching, parsing, programs)
- **Upstash Vector** for embeddings and semantic search

Why? Fewer API keys, simpler error handling, consistent response formats.

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENTS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────┐     ┌─────────────────────┐                       │
│   │   Mobile App        │     │   Web App           │                       │
│   │   (Expo Router)     │     │   (Next.js 14)      │                       │
│   │                     │     │                     │                       │
│   │   - Expo SDK 53     │     │   - App Router      │                       │
│   │   - TanStack Query  │     │   - TanStack Query  │                       │
│   │   - Zustand (auth)  │     │   - Zustand (auth)  │                       │
│   │   - Expo SQLite     │     │   - No offline      │                       │
│   │   - tRPC Client     │     │   - tRPC Client     │                       │
│   └──────────┬──────────┘     └──────────┬──────────┘                       │
│              │                           │                                   │
│              └───────────┬───────────────┘                                   │
│                          │                                                   │
└──────────────────────────┼───────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   tRPC      │
                    │   Client    │
                    └──────┬──────┘
                           │ Type-safe RPC calls
                           │
┌──────────────────────────┼───────────────────────────────────────────────────┐
│                          │           BACKEND                                  │
├──────────────────────────┼───────────────────────────────────────────────────┤
│                          │                                                    │
│                   ┌──────▼──────┐                                            │
│                   │   Next.js   │                                            │
│                   │   API Routes│                                            │
│                   │   + tRPC    │                                            │
│                   └──────┬──────┘                                            │
│                          │                                                    │
│         ┌────────────────┼────────────────┐                                  │
│         │                │                │                                  │
│   ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐                             │
│   │  Domain   │   │  Domain   │   │  Domain   │                             │
│   │  Workout  │   │  Program  │   │  Health   │                             │
│   │           │   │           │   │           │                             │
│   │ - voice   │   │ - generate│   │ - wearable│                             │
│   │ - logging │   │ - schedule│   │ - snapshot│                             │
│   │ - PRs     │   │ - calendar│   │ - injury  │                             │
│   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘                             │
│         │               │               │                                    │
│         └───────────────┼───────────────┘                                    │
│                         │                                                    │
│                  ┌──────▼──────┐                                             │
│                  │   Services  │                                             │
│                  │   Layer     │                                             │
│                  └──────┬──────┘                                             │
│                         │                                                    │
└─────────────────────────┼────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
   ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
   │ Supabase  │   │   AI      │   │ External  │
   │           │   │           │   │           │
   │ - Postgres│   │ - Grok 4  │   │ - Terra   │
   │ - Auth    │   │ - Upstash │   │ - WHOOP   │
   │ - Realtime│   │   Vector  │   │ - Weather │
   │ - Storage │   │ - Redis   │   │ - Stryd   │
   └───────────┘   └───────────┘   └───────────┘
```

---

## Monorepo Structure

```
voicefit/
├── package.json                    # Workspace root
├── turbo.json                      # Turborepo config
├── pnpm-workspace.yaml             # pnpm workspaces
│
├── apps/
│   ├── mobile/                     # Expo app
│   │   ├── app/                    # Expo Router pages
│   │   │   ├── (tabs)/             # Tab navigation
│   │   │   │   ├── index.tsx       # Home
│   │   │   │   ├── chat.tsx        # AI Coach
│   │   │   │   ├── run.tsx         # Running
│   │   │   │   └── profile.tsx     # Profile
│   │   │   ├── workout/            # Workout flows
│   │   │   ├── program/            # Program screens
│   │   │   └── _layout.tsx         # Root layout
│   │   ├── components/             # Mobile components
│   │   ├── hooks/                  # Mobile hooks
│   │   └── package.json
│   │
│   └── web/                        # Next.js app (unified)
│       ├── app/                    # Next.js App Router
│       │   ├── (marketing)/        # Public pages
│       │   ├── (dashboard)/        # User dashboard
│       │   ├── (coach)/            # Coach portal
│       │   ├── api/                # API routes
│       │   │   └── trpc/           # tRPC handler
│       │   └── layout.tsx
│       ├── components/             # Web components
│       └── package.json
│
├── packages/
│   ├── api/                        # tRPC routers & procedures
│   │   ├── src/
│   │   │   ├── routers/
│   │   │   │   ├── voice.ts        # Voice parsing
│   │   │   │   ├── workout.ts      # Workout logging
│   │   │   │   ├── program.ts      # Program generation
│   │   │   │   ├── health.ts       # Health & wearables
│   │   │   │   ├── coach.ts        # AI coaching
│   │   │   │   ├── user.ts         # User management
│   │   │   │   └── index.ts        # Root router
│   │   │   ├── services/
│   │   │   │   ├── ai.ts           # Grok service
│   │   │   │   ├── vector.ts       # Upstash vector
│   │   │   │   ├── wearables.ts    # Wearable integrations
│   │   │   │   └── cache.ts        # Redis caching
│   │   │   ├── context.ts          # tRPC context
│   │   │   └── trpc.ts             # tRPC init
│   │   └── package.json
│   │
│   ├── db/                         # Database layer
│   │   ├── src/
│   │   │   ├── schema.ts           # Drizzle schema
│   │   │   ├── client.ts           # Supabase client
│   │   │   ├── queries/            # Type-safe queries
│   │   │   └── migrations/         # SQL migrations
│   │   └── package.json
│   │
│   ├── shared/                     # Shared utilities
│   │   ├── src/
│   │   │   ├── types/              # Shared types
│   │   │   ├── validators/         # Zod schemas
│   │   │   ├── constants/          # App constants
│   │   │   └── utils/              # Shared utils
│   │   └── package.json
│   │
│   └── ui/                         # Shared UI components
│       ├── src/
│       │   ├── primitives/         # Button, Input, Card
│       │   ├── composites/         # WorkoutCard, StatsChart
│       │   └── index.ts
│       └── package.json
│
├── tooling/
│   ├── eslint/                     # Shared ESLint config
│   ├── typescript/                 # Shared tsconfig
│   └── tailwind/                   # Shared Tailwind config
│
└── supabase/
    ├── migrations/                 # SQL migrations
    └── functions/                  # Edge functions (webhooks)
```

---

## Key Technical Decisions

### 1. tRPC for Type-Safe APIs

**Current Problem:** Python backend with manual TypeScript types leads to mismatches.

**Solution:** tRPC provides automatic type inference.

```typescript
// packages/api/src/routers/voice.ts
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { aiService } from '../services/ai';
import { vectorService } from '../services/vector';

export const voiceRouter = router({
  parse: protectedProcedure
    .input(z.object({
      text: z.string().min(1),
      sessionId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Match exercise using vector search
      const exerciseMatch = await vectorService.searchExercise(input.text);

      // 2. Parse with AI
      const parsed = await aiService.parseVoiceCommand({
        text: input.text,
        userId: ctx.user.id,
        exerciseMatch,
        sessionContext: input.sessionId
          ? await ctx.db.getSessionContext(input.sessionId)
          : undefined,
      });

      // 3. Auto-save if high confidence
      if (parsed.confidence > 0.9) {
        await ctx.db.workoutLogs.create({
          userId: ctx.user.id,
          exerciseId: parsed.exerciseId,
          sets: parsed.sets,
          source: 'voice',
        });
      }

      return parsed; // Types automatically flow to frontend!
    }),

  log: protectedProcedure
    .input(z.object({
      exerciseId: z.string(),
      sets: z.array(z.object({
        reps: z.number().int().positive(),
        weight: z.number().positive().optional(),
        rpe: z.number().min(1).max(10).optional(),
      })),
      workoutId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const log = await ctx.db.workoutLogs.create({
        userId: ctx.user.id,
        ...input,
      });

      // Check for PRs
      const pr = await ctx.db.checkForPR(ctx.user.id, input.exerciseId, input.sets);

      // Check for badges
      const badges = await ctx.db.checkBadges(ctx.user.id);

      return { log, pr, badges };
    }),
});
```

```typescript
// apps/mobile/hooks/useVoice.ts
import { api } from '@/lib/trpc';

export function useVoiceParse() {
  const mutation = api.voice.parse.useMutation({
    onSuccess: (data) => {
      // data is fully typed!
      if (data.pr) {
        showPRCelebration(data.pr);
      }
      if (data.badges.length > 0) {
        showBadgeUnlock(data.badges);
      }
    },
    onError: (error) => {
      // error.message is typed too
      showToast({ message: error.message, type: 'error' });
    },
  });

  return mutation;
}
```

### 2. Simplified Offline Strategy

**Current Problem:** WatermelonDB is complex, requires model definitions, and sync is brittle.

**Solution:** Use Expo SQLite + TanStack Query's persistence.

```typescript
// packages/shared/src/offline/queue.ts
import * as SQLite from 'expo-sqlite';
import { z } from 'zod';

const ActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('workout.log'),
    payload: z.object({
      exerciseId: z.string(),
      sets: z.array(z.object({
        reps: z.number(),
        weight: z.number().optional(),
      })),
    }),
  }),
  z.object({
    type: z.literal('voice.parse'),
    payload: z.object({
      text: z.string(),
    }),
  }),
  // ... other action types
]);

export class OfflineQueue {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('offline-queue.db');
    this.init();
  }

  private init() {
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS queue (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        retries INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending'
      )
    `);
  }

  async enqueue(action: z.infer<typeof ActionSchema>) {
    const id = crypto.randomUUID();
    this.db.runSync(
      'INSERT INTO queue (id, action, created_at) VALUES (?, ?, ?)',
      [id, JSON.stringify(action), Date.now()]
    );
    return id;
  }

  async process(trpcClient: AppRouter) {
    const pending = this.db.getAllSync<QueueItem>(
      'SELECT * FROM queue WHERE status = ? ORDER BY created_at',
      ['pending']
    );

    for (const item of pending) {
      try {
        const action = ActionSchema.parse(JSON.parse(item.action));

        switch (action.type) {
          case 'workout.log':
            await trpcClient.workout.log.mutate(action.payload);
            break;
          case 'voice.parse':
            await trpcClient.voice.parse.mutate(action.payload);
            break;
        }

        this.db.runSync(
          'UPDATE queue SET status = ? WHERE id = ?',
          ['completed', item.id]
        );
      } catch (error) {
        this.db.runSync(
          'UPDATE queue SET retries = retries + 1 WHERE id = ?',
          [item.id]
        );
      }
    }
  }
}
```

```typescript
// apps/mobile/providers/offline.tsx
import { useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { OfflineQueue } from '@voicefit/shared/offline';
import { api } from '@/lib/trpc';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const netInfo = useNetInfo();
  const trpcClient = api.useContext();

  useEffect(() => {
    if (netInfo.isConnected) {
      // Process offline queue when back online
      const queue = new OfflineQueue();
      queue.process(trpcClient);
    }
  }, [netInfo.isConnected]);

  return <>{children}</>;
}
```

### 3. Unified Authentication

**Current Problem:** Auth disabled by default, localStorage in React Native, incomplete OAuth.

**Solution:** Supabase Auth with proper configuration.

```typescript
// packages/api/src/context.ts
import { createClient } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

export async function createContext({ req }: CreateNextContextOptions) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // Server-side, no persistence
      },
    }
  );

  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, db: createDbClient(supabase) };
  }

  const token = authHeader.slice(7);

  // Verify with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, db: createDbClient(supabase) };
  }

  // Get user profile
  const profile = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return {
    user: {
      id: user.id,
      email: user.email!,
      tier: profile.data?.tier ?? 'free',
      isCoach: profile.data?.user_type === 'coach',
    },
    db: createDbClient(supabase),
  };
}

// packages/api/src/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Authenticated procedure - ALWAYS requires auth
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Premium procedure
export const premiumProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.tier === 'free') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This feature requires a premium subscription',
    });
  }
  return next();
});

// Coach procedure
export const coachProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user.isCoach) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This feature is only available to coaches',
    });
  }
  return next();
});
```

```typescript
// apps/mobile/lib/auth.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Secure storage adapter for Expo
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: secureStorage,  // Use SecureStore, NOT localStorage!
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,

      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        set({ user: mapUser(data.user), session: data.session });
      },

      signUp: async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (error) throw error;
        set({ user: mapUser(data.user), session: data.session });
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
      },

      signInWithApple: async () => {
        // Proper Apple OAuth implementation
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        if (!credential.identityToken) {
          throw new Error('No identity token');
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) throw error;
        set({ user: mapUser(data.user), session: data.session });
      },

      signInWithGoogle: async () => {
        // Proper Google OAuth with web browser flow
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'voicefit://auth/callback',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) throw error;
        // Handle redirect in useEffect listener
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ user: state.user }), // Only persist user
    }
  )
);
```

### 4. Consolidated AI Service

**Current Problem:** Multiple AI providers (Grok, Kimi, OpenAI) with different patterns.

**Solution:** Single abstraction layer, one primary provider.

```typescript
// packages/api/src/services/ai.ts
import { xai } from '@ai-sdk/xai';
import { generateText, streamText } from 'ai';
import { z } from 'zod';

const VoiceParseSchema = z.object({
  exercise: z.object({
    name: z.string(),
    matchedId: z.string().optional(),
    confidence: z.number(),
  }),
  sets: z.array(z.object({
    reps: z.number(),
    weight: z.number().optional(),
    unit: z.enum(['lbs', 'kg']).optional(),
    rpe: z.number().optional(),
  })),
  modifiers: z.object({
    sameWeight: z.boolean().default(false),
    dropSet: z.boolean().default(false),
    pauseRep: z.boolean().default(false),
  }).optional(),
});

export class AIService {
  private model = xai('grok-4-fast');

  async parseVoiceCommand(params: {
    text: string;
    userId: string;
    exerciseMatch?: ExerciseMatch;
    sessionContext?: SessionContext;
  }) {
    const systemPrompt = `You are a fitness voice command parser.
Extract workout data from natural language.

${params.exerciseMatch ? `Matched exercise: ${params.exerciseMatch.name} (ID: ${params.exerciseMatch.id})` : ''}
${params.sessionContext ? `Previous sets this session: ${JSON.stringify(params.sessionContext.recentSets)}` : ''}

Rules:
- "Same weight" means use weight from last set
- Support multiple sets: "3 sets of 10" = 3 identical sets
- Default to lbs if no unit specified
- RPE is optional (1-10 scale)`;

    const { text } = await generateText({
      model: this.model,
      system: systemPrompt,
      prompt: `Parse this voice command: "${params.text}"

Return JSON matching this schema:
${JSON.stringify(VoiceParseSchema.shape, null, 2)}`,
    });

    const parsed = VoiceParseSchema.parse(JSON.parse(text));
    return parsed;
  }

  async generateProgram(params: {
    userId: string;
    goals: string[];
    experience: 'beginner' | 'intermediate' | 'advanced';
    daysPerWeek: number;
    equipment: string[];
    ragContext: string;
  }) {
    const { text } = await generateText({
      model: this.model,
      system: `You are an expert strength coach creating a 12-week periodized program.

Use this knowledge base context:
${params.ragContext}`,
      prompt: `Create a training program for:
- Goals: ${params.goals.join(', ')}
- Experience: ${params.experience}
- Days per week: ${params.daysPerWeek}
- Equipment: ${params.equipment.join(', ')}

Return a structured JSON program with weeks, days, and exercises.`,
    });

    return ProgramSchema.parse(JSON.parse(text));
  }

  async *streamCoachResponse(params: {
    question: string;
    userId: string;
    userContext: UserContext;
    ragContext: string;
  }) {
    const stream = await streamText({
      model: this.model,
      system: `You are an AI fitness coach. Be helpful, concise, and evidence-based.

User context:
${JSON.stringify(params.userContext, null, 2)}

Knowledge base:
${params.ragContext}`,
      prompt: params.question,
    });

    for await (const chunk of stream.textStream) {
      yield chunk;
    }
  }
}

export const aiService = new AIService();
```

### 5. Domain-Driven Organization

**Current Problem:** 129 endpoints in single file, hard to navigate.

**Solution:** Domain-driven routers with clear separation.

```typescript
// packages/api/src/routers/index.ts
import { router } from '../trpc';
import { voiceRouter } from './voice';
import { workoutRouter } from './workout';
import { programRouter } from './program';
import { healthRouter } from './health';
import { coachRouter } from './coach';
import { userRouter } from './user';
import { runningRouter } from './running';
import { badgeRouter } from './badge';
import { analyticsRouter } from './analytics';

export const appRouter = router({
  voice: voiceRouter,       // ~8 procedures
  workout: workoutRouter,   // ~10 procedures
  program: programRouter,   // ~8 procedures
  health: healthRouter,     // ~15 procedures (wearables, snapshots)
  coach: coachRouter,       // ~10 procedures
  user: userRouter,         // ~8 procedures
  running: runningRouter,   // ~10 procedures
  badge: badgeRouter,       // ~6 procedures
  analytics: analyticsRouter, // ~10 procedures
});

export type AppRouter = typeof appRouter;
```

```typescript
// packages/api/src/routers/workout.ts
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const workoutRouter = router({
  // Log a workout set
  log: protectedProcedure
    .input(LogSetInput)
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),

  // Get workout history
  history: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      cursor: z.string().optional(),
      exerciseId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Implementation
    }),

  // Get single workout
  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Implementation
    }),

  // Start a workout session
  startSession: protectedProcedure
    .input(z.object({
      programWorkoutId: z.string().uuid().optional(),
      type: z.enum(['strength', 'cardio', 'mixed']),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),

  // End workout session
  endSession: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),

  // Get active session
  activeSession: protectedProcedure
    .query(async ({ ctx }) => {
      // Implementation
    }),

  // Delete a workout log
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),

  // Update a workout log
  update: protectedProcedure
    .input(UpdateLogInput)
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),

  // Get workout insights
  insights: protectedProcedure
    .input(z.object({ workoutId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Implementation with AI analysis
    }),
});
```

### 6. Database with Type Safety

**Current Problem:** Manual SQL migrations, no type-safe queries.

**Solution:** Drizzle ORM for type-safe database operations.

```typescript
// packages/db/src/schema.ts
import { pgTable, uuid, text, timestamp, integer, decimal, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  tier: text('tier', { enum: ['free', 'premium', 'coach'] }).default('free'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const workoutLogs = pgTable('workout_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  exerciseId: text('exercise_id').notNull(),
  exerciseName: text('exercise_name').notNull(),
  sessionId: uuid('session_id').references(() => workoutSessions.id),
  reps: integer('reps').notNull(),
  weight: decimal('weight', { precision: 10, scale: 2 }),
  unit: text('unit', { enum: ['lbs', 'kg'] }).default('lbs'),
  rpe: integer('rpe'),
  source: text('source', { enum: ['voice', 'manual', 'quick'] }).default('manual'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  programWorkoutId: uuid('program_workout_id').references(() => programWorkouts.id),
  type: text('type', { enum: ['strength', 'cardio', 'mixed'] }).notNull(),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  notes: text('notes'),
});

export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  weeks: integer('weeks').notNull(),
  focus: text('focus', { enum: ['strength', 'hypertrophy', 'endurance', 'hybrid'] }),
  isActive: boolean('is_active').default(true),
  generatedBy: text('generated_by', { enum: ['ai', 'coach', 'user'] }).default('ai'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const personalRecords = pgTable('personal_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  exerciseId: text('exercise_id').notNull(),
  exerciseName: text('exercise_name').notNull(),
  weight: decimal('weight', { precision: 10, scale: 2 }).notNull(),
  reps: integer('reps').notNull(),
  estimated1RM: decimal('estimated_1rm', { precision: 10, scale: 2 }),
  workoutLogId: uuid('workout_log_id').references(() => workoutLogs.id),
  achievedAt: timestamp('achieved_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workoutLogs: many(workoutLogs),
  programs: many(programs),
  personalRecords: many(personalRecords),
}));

export const workoutLogsRelations = relations(workoutLogs, ({ one }) => ({
  user: one(users, { fields: [workoutLogs.userId], references: [users.id] }),
  session: one(workoutSessions, { fields: [workoutLogs.sessionId], references: [workoutSessions.id] }),
}));
```

```typescript
// packages/db/src/queries/workout.ts
import { db } from '../client';
import { workoutLogs, personalRecords } from '../schema';
import { eq, and, desc, gte } from 'drizzle-orm';

export async function createWorkoutLog(data: NewWorkoutLog) {
  const [log] = await db
    .insert(workoutLogs)
    .values(data)
    .returning();

  return log;
}

export async function getWorkoutHistory(userId: string, limit = 20) {
  return db
    .select()
    .from(workoutLogs)
    .where(eq(workoutLogs.userId, userId))
    .orderBy(desc(workoutLogs.createdAt))
    .limit(limit);
}

export async function getVolumeByMuscle(userId: string, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db
    .select({
      muscleGroup: exercises.primaryMuscle,
      totalSets: sql<number>`count(*)`,
      totalVolume: sql<number>`sum(${workoutLogs.weight} * ${workoutLogs.reps})`,
    })
    .from(workoutLogs)
    .innerJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
    .where(
      and(
        eq(workoutLogs.userId, userId),
        gte(workoutLogs.createdAt, startDate)
      )
    )
    .groupBy(exercises.primaryMuscle);
}

export async function checkForPR(
  userId: string,
  exerciseId: string,
  weight: number,
  reps: number
) {
  const estimated1RM = weight * (1 + reps / 30); // Epley formula

  const currentPR = await db
    .select()
    .from(personalRecords)
    .where(
      and(
        eq(personalRecords.userId, userId),
        eq(personalRecords.exerciseId, exerciseId)
      )
    )
    .orderBy(desc(personalRecords.estimated1RM))
    .limit(1);

  if (!currentPR[0] || estimated1RM > Number(currentPR[0].estimated1RM)) {
    return { isPR: true, improvement: currentPR[0]
      ? estimated1RM - Number(currentPR[0].estimated1RM)
      : estimated1RM };
  }

  return { isPR: false };
}
```

---

## Feature Parity Checklist

All current features would be preserved:

### Voice & Logging
- [x] Voice command parsing with Grok 4
- [x] 452+ exercise database with vector search
- [x] Context-aware parsing ("same weight")
- [x] Multi-set support ("3 sets of 10")
- [x] Auto-save on high confidence
- [x] PR detection and celebration

### AI Coaching
- [x] Ask questions, get RAG-enhanced answers
- [x] Exercise substitutions with reasoning
- [x] Program generation (strength, running, hybrid)
- [x] Injury-aware recommendations
- [x] Personalized insights

### Running
- [x] GPS tracking with Expo Location
- [x] Structured workouts (intervals, tempo)
- [x] Real-time metrics (pace, distance, elevation)
- [x] Weather integration
- [x] Shoe mileage tracking

### Health & Wearables
- [x] Terra integration (8+ providers)
- [x] WHOOP direct integration
- [x] Stryd running power
- [x] Daily health snapshots
- [x] Recovery recommendations

### Coach Features
- [x] Client management dashboard
- [x] Program assignment
- [x] CSV/Excel import
- [x] Client progress viewing

### Gamification
- [x] 90+ achievement badges
- [x] Streak tracking
- [x] PR history
- [x] Weekly summaries

---

## Migration Strategy

If migrating the existing codebase:

### Phase 1: Foundation (2 weeks)
1. Set up new monorepo structure with Turborepo
2. Create shared packages (types, validators, UI)
3. Set up tRPC with basic auth procedures
4. Migrate database to Drizzle schema

### Phase 2: Core APIs (3 weeks)
1. Migrate voice parsing to tRPC procedure
2. Migrate workout logging
3. Migrate program generation
4. Set up new AI service abstraction

### Phase 3: Mobile App (3 weeks)
1. Convert to Expo Router
2. Implement TanStack Query + tRPC client
3. Fix auth with SecureStore
4. Implement new offline strategy

### Phase 4: Web Apps (2 weeks)
1. Merge web and dashboard into single Next.js app
2. Implement tRPC client
3. Add role-based routing

### Phase 5: Polish (2 weeks)
1. Add remaining features
2. Testing and QA
3. Performance optimization
4. Documentation

**Total: ~12 weeks for full migration**

---

## Cost Comparison

| Service | Current Monthly | Proposed Monthly |
|---------|-----------------|------------------|
| Supabase | $25 (Pro) | $25 (Pro) |
| xAI (Grok) | ~$100 | ~$150 (more usage) |
| Moonshot (Kimi) | ~$50 | $0 (removed) |
| OpenAI | ~$20 | $0 (removed) |
| Upstash Redis | $10 | $10 |
| Upstash Vector | $25 | $25 |
| Railway/Vercel | $20 | $20 (simpler deploy) |
| **Total** | **~$250** | **~$230** |

Plus reduced developer time for maintenance.

---

## Summary

| Aspect | Current | Proposed |
|--------|---------|----------|
| Backend Language | Python | TypeScript |
| API Style | REST (129 endpoints) | tRPC (~75 procedures) |
| Type Safety | Manual sync | Automatic |
| Auth | Optional, localStorage | Required, SecureStore |
| Offline | WatermelonDB | Expo SQLite + Queue |
| AI Providers | 3 (Grok, Kimi, OpenAI) | 1 (Grok) |
| Frontend Apps | 3 separate | 2 (mobile, unified web) |
| State Management | Zustand + local | TanStack Query + minimal Zustand |
| API Docs | None | Types ARE docs |
| Files for API | 1 (230KB) | ~10 domain routers |

**The result:** A simpler, more maintainable codebase with full type safety, better developer experience, and the same powerful features.
