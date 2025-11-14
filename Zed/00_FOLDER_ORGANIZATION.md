# Zed Folder Organization Guide

**Last Updated**: November 14, 2025  
**Purpose**: Clear organization of current vs old vs reference documentation

---

## 📁 Folder Structure

```
Zed/
├── 00_FOLDER_ORGANIZATION.md (THIS FILE - read first!)
├── README_START_HERE.md (START HERE for UI rebuild)
├── # VoiceFit ZED Master Index.md (Overall project index)
│
├── 🟢 CURRENT ACTIVE DOCS (UI Rebuild - November 2025)
│   ├── UI_REBUILD_COMPLETE_GUIDE.md ⭐ MAIN IMPLEMENTATION GUIDE
│   ├── UI_REBUILD_CHECKLIST.md (Execution checklist)
│   ├── UI_REDESIGN_MASTER_PLAN.md (Detailed specifications)
│   ├── UI_COMPONENT_INVENTORY.md (Component tracking)
│   ├── UI_RECOVERY_ACTION_PLAN.md (Recovery plan)
│   ├── UI_RECOVERY_EXECUTIVE_SUMMARY.md (Executive summary)
│   └── UI_UX_RECOVERY_STATUS.md (Status report)
│
├── 📚 reference-from-lost-session/
│   ├── # VoiceFit UI Redesign Specification.ini ⭐ ORIGINAL SPEC (822 lines)
│   ├── Profile Screen.txt ⭐ COMPLETE PROFILE CODE (589 lines)
│   ├── VoiceFit SSO Setup Guide.md (SSO configuration)
│   ├── # VoiceFit UI Redesign - Phase 4, 5, 6 Q.md (Phase reference)
│   └── UI Convo Prompt.txt (Original prompts)
│
└── 🗄️ archive-old-docs/
    ├── # VoiceFit - Comprehensive TODO List.md (Pre-UI-rebuild)
    ├── # VoiceFit Quick Reference Card.md (Pre-UI-rebuild)
    ├── Original Audit.md (January 2025 audit)
    └── ZED Documentation Folder.md (Old folder structure)
```

---

## 🟢 CURRENT DOCS (Use These!)

**Purpose**: Active UI rebuild documentation created November 14, 2025

### Primary Documents

1. **README_START_HERE.md**
   - Your entry point
   - Situation summary
   - Quick start instructions
   - Read this first!

2. **UI_REBUILD_COMPLETE_GUIDE.md** ⭐ **MAIN GUIDE**
   - Complete design system specifications
   - All component specs with TypeScript interfaces
   - All screen layouts with ASCII mockups
   - Session-by-session implementation plan
   - Testing checklist
   - **→ Use this for implementation**

3. **UI_REBUILD_CHECKLIST.md**
   - Checkbox lists for every task
   - Code examples for components
   - Step-by-step instructions
   - **→ Use this to track progress**

4. **UI_REDESIGN_MASTER_PLAN.md**
   - Deep dive into design decisions
   - Component build order (6 sprints)
   - Screen-by-screen details
   - **→ Reference for details**

### Supporting Documents

5. **UI_COMPONENT_INVENTORY.md**
   - Component status (existing, lost, planned)
   - Build order recommendations
   - Screen-to-component mapping

6. **UI_RECOVERY_ACTION_PLAN.md**
   - Recovery timeline
   - Decision gates
   - User response template

7. **UI_RECOVERY_EXECUTIVE_SUMMARY.md**
   - Quick overview
   - Bottom line summary

8. **UI_UX_RECOVERY_STATUS.md**
   - What was lost vs what survived
   - Phase-by-phase status
   - Open questions list

---

## 📚 REFERENCE DOCS (From Lost Session)

**Purpose**: Original materials from yesterday's session that was lost

**Location**: `reference-from-lost-session/`

### ⭐ Key Reference Files

1. **# VoiceFit UI Redesign Specification.ini** (822 lines)
   - Original complete specification
   - MacroFactor design system
   - Screen layouts and specs
   - Color palette, typography, spacing
   - **→ Source of truth for design decisions**
   - Status: Reference only (consolidated into COMPLETE_GUIDE)

2. **Profile Screen.txt** (589 lines)
   - Complete ProfileScreen implementation
   - Working code from lost session
   - **→ Can copy directly for Session 3**
   - Status: ACTIVE REFERENCE - use this code!

3. **VoiceFit SSO Setup Guide.md**
   - Apple and Google SSO configuration
   - Step-by-step setup instructions
   - Backend integration guide
   - **→ Reference when implementing SSO**
   - Status: ACTIVE REFERENCE - still valid

4. **# VoiceFit UI Redesign - Phase 4, 5, 6 Q.md**
   - Phase 4-6 reference (Home, Run, Analytics)
   - Previous implementation notes
   - Status: Reference only (approach changed)

5. **UI Convo Prompt.txt**
   - Original user prompts from yesterday
   - Design inspirations mentioned
   - Status: Historical reference

### When to Use Reference Docs

- ✅ **DO USE**: Profile Screen.txt (copy code directly)
- ✅ **DO USE**: SSO Setup Guide (configuration steps)
- ✅ **DO REFERENCE**: UI Redesign Specification (verify design decisions)
- ⚠️ **REFERENCE ONLY**: Phase 4-6 doc (approach has changed)
- 📖 **HISTORICAL**: UI Convo Prompt (context only)

---

## 🗄️ ARCHIVED DOCS (Old Project Docs)

**Purpose**: Pre-UI-rebuild project documentation from January 2025

**Location**: `archive-old-docs/`

### What's Archived

1. **# VoiceFit - Comprehensive TODO List.md**
   - Pre-UI-rebuild TODO list
   - Status: Superseded by new checklist
   - Keep for historical reference

2. **# VoiceFit Quick Reference Card.md**
   - Pre-UI-rebuild quick reference
   - Status: Superseded by README_START_HERE
   - Keep for historical reference

3. **Original Audit.md**
   - January 2025 project audit
   - Phase 1 fixes and analysis
   - Status: Historical record
   - Keep for context

4. **ZED Documentation Folder.md**
   - Old folder structure documentation
   - Status: Superseded by this file
   - Keep for historical reference

### When to Use Archived Docs

- ⚠️ **DO NOT USE** for current UI rebuild
- 📖 **REFERENCE ONLY** for historical context
- ✅ **KEEP** for project history

---

## 📋 Quick Decision Guide

### "Which document should I use for..."

**Starting UI rebuild?**
→ `README_START_HERE.md`

**Implementing a component?**
→ `UI_REBUILD_COMPLETE_GUIDE.md` (specs) + `UI_REBUILD_CHECKLIST.md` (code)

**Building ProfileScreen?**
→ `reference-from-lost-session/Profile Screen.txt` (copy code directly!)

**Setting up SSO?**
→ `reference-from-lost-session/VoiceFit SSO Setup Guide.md`

**Understanding design decisions?**
→ `UI_REDESIGN_MASTER_PLAN.md` or `reference-from-lost-session/# VoiceFit UI Redesign Specification.ini`

**Tracking progress?**
→ `UI_REBUILD_CHECKLIST.md`

**Understanding what happened?**
→ `UI_RECOVERY_EXECUTIVE_SUMMARY.md`

**Historical project context?**
→ `archive-old-docs/`

---

## ✅ Current Status

**Active Documentation**: ✅ Complete and ready to use
- All current docs created November 14, 2025
- All reference materials organized
- All old docs archived

**Next Action**: Read `README_START_HERE.md`, then begin implementation

---

## 🚫 IMPORTANT: Do Not Use

**These files are OLD and should NOT be used for current UI rebuild:**
- ❌ Anything in `archive-old-docs/` (pre-UI-rebuild)
- ❌ `# VoiceFit UI Redesign - Phase 4, 5, 6 Q.md` (approach changed)

**These files are REFERENCE only (verify against current docs):**
- ⚠️ `# VoiceFit UI Redesign Specification.ini` (consolidated into COMPLETE_GUIDE)

**These files CAN be used directly:**
- ✅ `Profile Screen.txt` (copy code for ProfileScreen implementation)
- ✅ `VoiceFit SSO Setup Guide.md` (follow for SSO setup)

---

## 🔄 Maintenance

**When to Update This File:**
- New major documentation added
- Folder structure changes
- Status of documents changes (e.g., doc becomes outdated)

**How to Keep Organized:**
1. Current docs stay in root `Zed/` folder
2. Reference materials in `reference-from-lost-session/`
3. Old docs in `archive-old-docs/`
4. Update this file when structure changes

---

## 📞 Summary

**For UI Rebuild Implementation:**
1. Read: `README_START_HERE.md`
2. Use: `UI_REBUILD_COMPLETE_GUIDE.md` (main guide)
3. Use: `UI_REBUILD_CHECKLIST.md` (execution)
4. Reference: `Profile Screen.txt` and `SSO Setup Guide.md`
5. Ignore: Everything in `archive-old-docs/`

**You're all set!** 🚀

---

*Last Updated: November 14, 2025*  
*Next Review: When folder structure changes*