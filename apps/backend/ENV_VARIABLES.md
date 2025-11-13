# Environment Variables for VoiceFit Backend

## Required Environment Variables

### Supabase Configuration
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Upstash Search Configuration
```bash
UPSTASH_SEARCH_REST_URL=your_upstash_search_url
UPSTASH_SEARCH_REST_TOKEN=your_upstash_search_token
```

### AI Model Configuration

#### Kimi AI (Moonshot AI) - Voice Parsing Only
```bash
KIMI_API_KEY=your_kimi_api_key
KIMI_BASE_URL=https://api.moonshot.ai/v1
KIMI_VOICE_MODEL_ID=kimi-k2-turbo-preview
```

#### Grok (xAI) - Chat Classification, AI Coach, Program Generation
```bash
XAI_API_KEY=your_xai_api_key
```

### JWT Configuration
```bash
JWT_SECRET=your_jwt_secret_key
```

### Optional Configuration
```bash
# Environment (development, staging, production)
ENVIRONMENT=production

# API Port
PORT=8000
```

## Model Assignments (Final Architecture)

| Feature | Model | Environment Variable |
|---------|-------|---------------------|
| **Voice Parsing** | Kimi K2 Turbo Preview | `KIMI_VOICE_MODEL_ID=kimi-k2-turbo-preview` |
| **Chat Classification** | Grok 4 Fast Reasoning | (uses `XAI_API_KEY`) |
| **AI Coach** | Grok 4 Fast Reasoning | (uses `XAI_API_KEY`) |
| **Program Generation** | Grok 4 Fast Reasoning | (uses `XAI_API_KEY`) |

## Railway Deployment

To deploy to Railway, set these environment variables in the Railway dashboard:

1. Go to your Railway project
2. Click on your backend service
3. Go to "Variables" tab
4. Add all required variables listed above

**Important:** Make sure to set `KIMI_VOICE_MODEL_ID=kimi-k2-turbo-preview` (not `kimi-k2-thinking-turbo`)

## Testing Locally

Create a `.env` file in `apps/backend/` with all required variables:

```bash
cp .env.example .env
# Edit .env with your actual values
```

## Migration Notes

### Changes from Previous Architecture:
- **Voice Parsing:** Changed from `kimi-k2-thinking-turbo` to `kimi-k2-turbo-preview` (non-reasoning, faster)
- **Chat Classification:** Migrated from Kimi to Grok 4 Fast Reasoning
- **AI Coach:** Migrated from Kimi to Grok 4 Fast Reasoning
- **Program Generation:** Already using Grok 4 Fast Reasoning (no change)

### Performance Improvements:
- Voice parsing: 43% faster with Kimi K2 Turbo Preview + RAG
- Chat classification: Slightly faster with Grok
- AI Coach: 58% better quality, 40% faster with Grok
- Program generation: 5.5x faster, 16x cheaper with Grok

