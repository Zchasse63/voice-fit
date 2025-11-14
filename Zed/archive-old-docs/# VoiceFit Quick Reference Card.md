# VoiceFit Quick Reference Card

**Last Updated**: January 15, 2025  
**Purpose**: One-page cheat sheet for daily development

---

## 🚀 Essential Commands

### Start Development
```bash
# Terminal 1 - Start Metro
cd apps/mobile && npm start

# Terminal 2 - Build & Run
cd apps/mobile && npx expo run:ios --device "iPhone 17 Pro Max"
```

### When Something Breaks (try in order)
```bash
npm run clean:metro          # 10 seconds - fixes 90% of issues
npm run clean                # 1 minute - clean build artifacts
npm run rebuild:ios          # 5 minutes - full rebuild
npm run reset                # 10 minutes - nuclear option (always works)
```

### Health Check
```bash
npm run diagnose             # Automatic problem detection
npm list react react-native expo  # Check versions
```

---

## 📱 App Structure

**3 Bottom Tabs**:
1. **Home** - Overview, program, analytics, badges
2. **Chat** - Workout logging (voice/text), AI coach, onboarding
3. **Run** - GPS tracking for running workouts

---

## 🔧 Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Changes not showing | `npm run clean:metro && npm start` |
| Black screen | Check React/RN versions: `npm list react react-native` |
| Pod install fails | Check simdjson in `ios/Podfile` |
| Metro timeout | Kill all node: `killall -9 node`, restart Metro |
| Xcode build fails | Disable User Script Sandboxing in Xcode |
| Env var errors | Check `.env` file exists with correct values |

---

## 📚 Documentation Quick Links

| Need | Document |
|------|----------|
| Daily workflow | `ZED/QUICK_START.md` |
| Something broke | `ZED/TROUBLESHOOTING.md` |
| What's next | `ZED/TODO.md` |
| Big picture | `ZED/ORIGINAL_AUDIT_SUMMARY.md` |
| All docs | `ZED/MASTER_INDEX.md` |

---

## ⚙️ Critical Configuration

### Required Versions
- React: `19.0.0`
- React Native: `0.79.6`
- Expo SDK: `~53.0.0`
- Node: `20.19.5`

### Required Files
- `.env` - Supabase credentials (copy from `.env.example`)
- `ios/Podfile` - Must include simdjson for WatermelonDB

### Required Settings
- Xcode User Script Sandboxing: **NO** (not "Yes")
- npm install flag: **--legacy-peer-deps** (always)

---

## 🎯 Current Phase

- ✅ Phase 1: Build Stability (COMPLETE)
- ⏳ Phase 2: Security & Offline-First (CURRENT)

**Next Tasks**:
1. Implement Expo SecureStore for tokens
2. Complete WatermelonDB schema
3. Build sync service
4. Add input validation

See `ZED/TODO.md` for full task list.

---

## 💡 Pro Tips

### Save Time
```bash
# Instead of full rebuild, usually this works:
npm run clean:metro && npm start
```

### Metro Keyboard Shortcuts
- `r` - Reload app
- `d` - Toggle debugger
- `m` - Show menu
- `q` - Quit

### Check if Metro Running
```bash
lsof -i :8081    # Should show node process
```

### Quick Search All Docs
```bash
grep -r "your-search" ZED/
```

---

## 🆘 Emergency Recovery

**App completely broken?**
```bash
cd apps/mobile
npm run reset
# Wait ~10 minutes, always works
```

**Still broken after reset?**
1. Check Xcode User Script Sandboxing = NO
2. Check `.env` file exists and has values
3. Check `ios/Podfile` has simdjson line
4. Run `npm run diagnose` and follow suggestions

---

## 📞 Quick Help

1. Run `npm run diagnose` - See what's wrong
2. Check `ZED/TROUBLESHOOTING.md` - Find your error
3. Try clean commands - Usually fixes it

---

**Keep this card handy!** Bookmark or print for quick reference during development.