# Training Calendar - Design Reference

**Date:** 2025-01-24  
**Design Inspiration:** Runna app training calendar  
**Design Type:** List-based vertical schedule (NOT traditional grid calendar)  
**Status:** Design specification for implementation

---

## Design Philosophy

### Why List-Based Instead of Grid Calendar?

✅ **Mobile-First** - Optimized for phone screens (vertical scroll feels natural)  
✅ **Context-Rich** - Show workout details without drilling down  
✅ **Training-Focused** - Emphasizes workout progression over dates  
✅ **Simpler UX** - No horizontal scrolling or pinch-to-zoom needed  
✅ **Better for Workouts** - Can show multiple workouts per day side-by-side

---

## Screen Layout Structure

```
┌─────────────────────────────────────────┐
│  ←  Training calendar         Save      │  ← Header (fixed)
├─────────────────────────────────────────┤
│                                         │
│  SAT ┌────────────────────────────┐   │
│   8  │ 10mi Long Run             │ ✓  │
│      │ 10mi 🏃                   │    │
│      └────────────────────────────┘    │
│                                         │
│  SUN ┌────────────────────────────┐   │
│   9  │ Sunday Morning Run        │ ✓  │
│      │ 2.5 mi • 24m 58s          │    │
│      └────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Nov 10 - Nov 16  WEEK 9         │   │
│ │ Total: 5.4 mi / 21.6 mi   🔄 Reset  │
│ └─────────────────────────────────┘   │
│                                         │
│  MON ┌────────────────────────────┐   │
│  10  │ Morning Stair-Stepper     │ ✓  │
│      │ 0.0 mi • 40m 29s          │    │
│      └────────────────────────────┘    │
│                                         │
│  TUE ┌────────────────────────────┐   │
│  11  │ Endurance Supersets       │ ✓  │
│      │ 0m 27s                    │    │
│      └────────────────────────────┘    │
│                                         │
│  WED ┌──────────┐ ┌──────────┐ ┌────┐│
│  12  │ Wed Lun..│ │ Morning ..│ │Tape││ ✓ ✓
│      │ 0.0 mi • │ │ 0.0 mi •  │ │5.4m││
│      │ 43m 31s  │ │ 43m 29s   │ │    ││
│      └──────────┘ └──────────┘ └────┘│
│                                         │
│  THU ┌────────────────────────────┐   │
│  13  │ 3.5mi Easy Run            │    │
│      │ 3.5mi 🏃                  │    │
│      └────────────────────────────┘    │
│                                         │
│  FRI                                    │
│  14                                     │
│                                         │
│  SAT       + Add                        │
│  15                                     │
│                                         │
│  SUN ┌────────────────────────────┐   │
│  16  │ Regenexx St. Pete Run F.. │    │
│      │ 13.1mi                    │    │
│      └────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Nov 17 - Nov 23  WEEK 10        │   │
│ │ Total: 39.5 mi          🔄 Reset│   │
│ └─────────────────────────────────┘   │
│                                         │
│  MON       + Add                        │
│  17                                     │
│                                         │
│  TUE ┌────────────────────────────┐   │
│  18  │ 9mi Easy Run              │    │
│      └────────────────────────────┘    │
│                                         │
```

---

## Component Breakdown

### 1. Header Bar
```
┌─────────────────────────────────────────┐
│  ←  Training calendar         Save      │
└─────────────────────────────────────────┘
```

**Elements:**
- Back arrow (left) - iOS standard back navigation
- "Training calendar" title (center)
- "Save" button (right) - saves any modifications

**Specifications:**
- Height: 44px (iOS standard)
- Background: White
- Title font: SF Pro Display, 17pt, Semibold
- Back arrow: 24x24px icon
- Save button: Primary accent color

---

### 2. Week Section Header
```
┌─────────────────────────────────────────┐
│ Nov 10 - Nov 16  WEEK 9    🔄 Reset     │
│ Total: 5.4 mi / 21.6 mi                 │
└─────────────────────────────────────────┘
```

**Elements:**
- Date range (Nov 10 - Nov 16)
- Week badge (WEEK 9) - black pill shape with white text
- Total progress (5.4 mi / 21.6 mi) - completed / total
- Reset button (🔄 + "Reset" text)

**Specifications:**
- Background: Light gray (#F5F5F5)
- Padding: 16px
- Border radius: 8px
- Week badge: Black background, white text, 4px border radius
- Reset button: Gray icon + text, right-aligned

---

### 3. Day Row with Workout Cards
```
MON  ┌──────────────────────────────┐
10   │ Morning Stair-Stepper       │ ✓
     │ 0.0 mi • 40m 29s            │
     └──────────────────────────────┘
```

**Day Label (Left Column):**
- Day of week: 3-letter abbreviation (MON, TUE, WED)
- Day number: Date (10, 11, 12)
- Font: SF Pro, 12pt, Regular for day name, 20pt Bold for number
- Color: Gray (#666666)
- Width: 42px fixed

**Workout Card:**
- Background: White
- Border radius: 8px
- Shadow: 0px 2px 4px rgba(0,0,0,0.08)
- Padding: 12px
- Left color bar: 4px wide, full height, colored by workout type
- Checkmark: Black circle with white checkmark icon (right side if completed)

**Color Bar Colors:**
- 🔴 Red/Orange: Tempo, Hard runs, Intervals (#FF6B6B, #FF8C42)
- 🟡 Yellow/Green: Easy runs, Recovery runs (#FFD93D, #6BCF7F)
- 🔵 Blue: Strength workouts (#4A90E2)
- ⚫ Gray: Rest days, Light activities (#90A4AE)
- 🟣 Purple: Long runs (#9B59B6)

---

### 4. Multiple Workouts Per Day
```
WED  ┌────────┐ ┌────────┐ ┌────────┐
12   │ Wed.. │ │ Morn.. │ │ Taper │ ✓ ✓
     │ 43m   │ │ 43m    │ │ 5.4mi │
     └────────┘ └────────┘ └────────┘
```

**Layout:**
- Horizontal scroll if more than 2 workouts
- Each card: Min width 160px, Max width 250px
- Gap between cards: 8px
- All cards same height as single-workout cards

---

### 5. Empty Day with Add Button
```
FRI            
14             

SAT  + Add    
15            
```

**Add Button:**
- Background: Light gray (#F0F0F0)
- Border: 1px dashed gray (#CCCCCC)
- Border radius: 8px
- Height: 56px
- Text: "+ Add" in gray (#999999)
- Font: SF Pro, 14pt, Medium
- Centered icon and text

---

### 6. Workout Card States

**Default State:**
```
┌──────────────────────────────┐
│ 10mi Long Run               │
│ 10mi 🏃                     │
└──────────────────────────────┘
```

**Completed State:**
```
┌──────────────────────────────┐
│ 10mi Long Run              ✓│
│ 10mi 🏃                     │
└──────────────────────────────┘
```

**Dragging State:**
```
┌──────────────────────────────┐  ← Shadow enhanced
│ 10mi Long Run               │    Opacity 80%
│ 10mi 🏃                     │    Scale 1.05x
└──────────────────────────────┘
```

**Conflict Warning State:**
```
┌──────────────────────────────┐
│ ⚠️ Heavy Legs Day           │
│ 60min • High intensity      │
│ ⚠️ Long run scheduled tomorrow│
└──────────────────────────────┘
```

---

## Typography

### Workout Names
- Font: SF Pro Display
- Size: 16pt
- Weight: Semibold
- Color: #000000

### Workout Details (distance, time)
- Font: SF Pro
- Size: 14pt
- Weight: Regular
- Color: #666666

### Day Labels
- Day name (MON): 12pt, Regular, #999999
- Day number (10): 20pt, Bold, #333333

### Week Badge
- Font: SF Pro
- Size: 12pt
- Weight: Bold
- Color: #FFFFFF (on black background)

### Week Totals
- Font: SF Pro
- Size: 14pt
- Weight: Regular
- Color: #666666

---

## Spacing & Layout

### Margins & Padding
- Screen horizontal padding: 16px
- Day row vertical spacing: 8px
- Between week sections: 24px
- Card internal padding: 12px
- Color bar width: 4px
- Day label width: 42px
- Gap between day label and card: 12px

### Card Dimensions
- Min height: 56px
- Max height: Auto (content-based)
- Single workout width: 100% of available space
- Multiple workouts: Flexible width, min 160px, max 250px

---

## Interaction Patterns

### Drag-and-Drop Behavior

**1. Long Press to Start Drag (300ms)**
- Visual feedback: Card scales to 1.05x
- Opacity reduces to 80%
- Shadow increases (elevation boost)
- Haptic feedback (medium impact)

**2. During Drag**
- Card follows finger vertically
- Other cards shift to show drop target
- Drop target highlights with subtle background color
- If conflict detected, show warning indicator

**3. Drop**
- Card animates to new position (spring animation)
- If conflict exists, show warning modal
- Save happens automatically (or on "Save" button)
- Haptic feedback on successful drop

**4. Cancel Drag**
- Lift finger outside drop zone, OR
- Drag too far left/right (>50px)
- Card animates back to original position

### Tap Interactions

**Tap Workout Card:**
- Open workout details modal
- Show full workout description, exercises, notes
- Option to mark complete/incomplete
- Option to delete or reschedule

**Tap "+Add" Button:**
- Open workout creation modal
- Pre-fill date with selected day
- User selects workout type and details

**Tap "Reset" Button:**
- Show confirmation alert
- "Reset week 9 to original schedule?"
- On confirm: Restore all workouts to original dates for that week

**Tap Checkmark:**
- Toggle completion state
- Animate checkmark in/out
- Update week progress bar

---

## Week Overview Modal

```
┌─────────────────────────────────────────┐
│ Week 9 Overview                      ✕  │
├─────────────────────────────────────────┤
│                                         │
│ ▓▓▓▓░░░░░░░░░░░░░░░░░░░░  Progress    │
│                                         │
│ Workouts: 1/3                          │
│ Distance: 5.40/21.60mi                 │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Wednesday, Nov 12               │ ✓ │
│ │ Taper Two Miler                 │   │
│ │ Taper Intervals • 5mi           │   │
│ │                                 │   │
│ │ ┌─────────────────────────┐   │   │
│ │ │ Nov 12, 2025 • 8:36 AM │   │   │
│ │ │ Taper Two Miler        │ ⚡ │   │
│ │ │ 5.38 mi  42:13  7:51/mi│   │   │
│ │ └─────────────────────────┘   │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Thursday, Nov 13                │   │
│ │ 3.5mi Easy Run                  │   │
│ │ Easy Run • 3.5mi                │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Sunday, Nov 16                  │   │
│ │ Regenexx St. Pete Run Fest Half│   │
│ │ Marathon                        │   │
│ │ Race • 13.1mi                   │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │       View full week            │   │
│ └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Modal Specifications:**
- Presentation: Bottom sheet (pageSheet on iOS)
- Background: White
- Border radius: 16px (top corners)
- Close button: Top-right (X icon)
- Progress bar: Full width, 8px height, rounded
- Workout cards: Simplified version with less detail
- "View full week" button: Full-width CTA at bottom

---

## Animations

### Drag Animation
```
Duration: Follow finger (0ms lag)
Easing: Linear during drag
Spring config: { damping: 15, stiffness: 150 }
```

### Drop Animation
```
Duration: 300ms
Easing: Spring
Config: { damping: 12, stiffness: 120 }
```

### Card Scale on Drag Start
```
Duration: 150ms
From: scale(1)
To: scale(1.05)
Easing: Ease-out
```

### Checkmark Toggle
```
Duration: 200ms
Easing: Ease-in-out
Animate: Opacity + Scale
```

### Week Overview Modal
```
Entry: Slide up from bottom (300ms)
Exit: Slide down (250ms)
Background dim: Fade in/out (200ms)
```

---

## Accessibility

### VoiceOver Support
- Day labels: "Monday, November 10th"
- Workout cards: "Morning Stair-Stepper, 40 minutes 29 seconds, completed"
- Add button: "Add workout for Saturday, November 15th"
- Drag hint: "Long press to rearrange workout"

### Haptic Feedback
- Long press start: Medium impact
- Drop successful: Light impact
- Drop with conflict: Warning notification
- Checkmark toggle: Selection feedback

### Dynamic Type Support
- All text scales with system font size
- Maintain readability at 200% size
- Minimum touch target: 44x44pt

---

## Edge Cases

### 1. No Workouts Scheduled
```
┌─────────────────────────────────────────┐
│  No workouts scheduled this week        │
│                                         │
│  [+ Create Workout]                     │
└─────────────────────────────────────────┘
```

### 2. Week with Only Rest Days
```
MON  Rest Day
10   

TUE  Rest Day
11   
```

### 3. Long Workout Names
```
┌──────────────────────────────┐
│ Regenexx St. Pete Run Fest..│
│ Race • 13.1mi               │
└──────────────────────────────┘
```
Truncate with ellipsis (...) if name exceeds card width

### 4. Drag to Past Date
- Allow drag, but show warning
- "This workout was scheduled in the past. Reschedule anyway?"

### 5. Conflict Detected on Drop
```
┌──────────────────────────────┐
│ ⚠️ Scheduling Conflict        │
│                              │
│ Warning: Heavy leg day before│
│ tomorrow's long run may affect│
│ performance.                 │
│                              │
│ [Cancel] [Continue] [Auto-fix]│
└──────────────────────────────┘
```

---

## Implementation Notes

### React Native Libraries Required
- `react-native-gesture-handler` - For drag-and-drop
- `react-native-reanimated` - For smooth animations
- `react-native-haptic-feedback` - For haptic feedback
- `@react-native-community/datetimepicker` - For date selection

### Performance Considerations
- Virtualize long lists (use `FlatList` for weeks with 50+ items)
- Memoize workout cards to prevent re-renders during drag
- Debounce save operations (wait 500ms after last drag)
- Lazy load workout details (don't fetch until card tapped)

### State Management
- Use React Context or Redux for schedule state
- Optimistic updates (update UI immediately, sync to backend)
- Track which workouts are modified (`isUserModified` flag)
- Store original schedule for "Reset" functionality

---

## Success Criteria

✅ Calendar loads in <1 second  
✅ Drag-and-drop feels responsive (<16ms frame time)  
✅ All animations complete in <300ms  
✅ Touch targets meet 44x44pt minimum  
✅ VoiceOver describes all interactive elements  
✅ Conflicts detected within 100ms of drop  
✅ Works on screens from iPhone SE to iPad Pro  

---

**Last Updated:** 2025-01-24  
**Design Status:** Ready for implementation  
**Figma Link:** [TBD - Create design mockups if needed]