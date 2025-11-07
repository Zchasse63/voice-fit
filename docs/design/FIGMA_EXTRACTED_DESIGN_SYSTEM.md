# VoiceFit Figma Design System - API Extracted Data

**Source:** FinWise Banking UI Kit (Figma) - Extracted via Figma API  
**Adapted For:** VoiceFit - Voice-First Fitness Tracking Mobile App  
**Extraction Date:** 2025-11-06  
**Figma File:** https://www.figma.com/design/Cxy316I7lcSoCVAevLScpm/VF-MVP  
**File Key:** `Cxy316I7lcSoCVAevLScpm`  
**Last Modified:** 2025-11-04T19:02:20Z

---

## 📋 Figma File Structure

### Pages (5 Total)
1. **☀︎ FinWise App - Light Mode** (ID: `7020:3430`)
   - 127 screens
   - Main analytics screen: "7 - A - Quickly Analysis" (ID: `7020:3688`)
   
2. **☾ FinWise App - Dark Mode** (ID: `7388:3143`)
   - 127 screens (mirrors light mode)
   
3. **Design System** (ID: `1:422`)
   - Design tokens and components
   
4. **Information Architecture** (ID: `1:421`)
   - App structure and navigation
   
5. **Cover** (ID: `7226:4062`)
   - Project cover page

### Key Analytics/Stats Screens Found

| Screen Name | Type | ID | Purpose |
|-------------|------|-----|---------|
| 7 - A - Quickly Analysis | FRAME | 7020:3688 | Main analytics screen with charts |
| 9.2. Analysis | GROUP | 7038:183 | Analysis section group |
| 9.2.1 - A - Daily | FRAME | - | Daily analytics view |
| 9.2.2 - A - Weekly | FRAME | - | Weekly analytics view |
| 9.2.3 - A - Monthly | FRAME | - | Monthly analytics view |
| 9.2.4 - A - Yearly | FRAME | - | Yearly analytics view |
| 6 - A - Account Balance | FRAME | 7020:3680 | Balance with spending chart |
| 8 - A - Transaction | FRAME | 7033:2595 | Transaction history |
| 9.3.0 - A - Transaction | FRAME | 7035:978 | Transaction details |

### Components
- **Total Components:** 129
- **Analysis Components:** 2 (Analysis tab icons)
- **Published Components:** 0 (components not published to library)
- **Published Styles:** 0 (styles not published to library)

### Prototype & Interactions
- **Total Interactions:** 2,708
- **Animation Types:** SMART_ANIMATE, DISSOLVE
- **Prototype Flows:** 4 main flows
- **Component States:** 99 component variants

---

## 🎨 Extracted Color Variables (35 Fills)

### Primary Fill Colors from Figma

| Variable | Hex Value | Description |
|----------|-----------|-------------|
| `fill1` | `#00d09e` | Mint Green (FinWise primary) |
| `fill2` | `#f1fff2` | Very Light Green |
| `fill3` | `#0e3e3e` | Dark Teal |
| `fill4` | `#093030` | Darker Teal |
| `fill5` | `#dff7e2` | Light Mint |
| `fill7` | `rgba(30, 30, 30, 0.50)` | Semi-transparent Dark |
| `fill8` | `#ffffff` | White |
| `fill9` | `#363130` | Dark Gray |
| `fill10` | `#6cb5fd` | Light Blue |
| `fill11` | `#031314` | Almost Black |
| `fill12` | `#0068ff` | Bright Blue |
| `fill13` | `#000000` | Black |
| `fill14` | `#3299ff` | Sky Blue |
| `fill15` | `#052224` | Very Dark Teal |
| `fill16` | `#f1fff3` | Very Light Green 2 |
| `fill17` | `#4b4544` | Medium Gray |
| `fill33` | `#464646` | Medium Dark Gray |
| `fill34` | `#e5e4e4` | Light Gray |
| `fill35` | `rgba(223, 247, 226, 0.00)` | Transparent Green |

**Note:** `fill18-fill32` are image references, not solid colors.

### VoiceFit Color Adaptation

The FinWise colors have been adapted for VoiceFit's fitness-focused brand:

| FinWise Original | VoiceFit Adapted | Usage |
|------------------|------------------|-------|
| `#00d09e` (Mint) | `#2C5F3D` (Forest Green) | Primary brand color |
| `#0068ff` (Blue) | `#DD7B57` (Terracotta) | Secondary/warm accent |
| `#0e3e3e` (Dark Teal) | `#36625E` (Deep Teal) | Accent color |
| `#ffffff` (White) | `#FFFFFF` (White) | Light mode background |
| `#031314` (Almost Black) | `#1A1A1A` (Charcoal) | Dark mode background |

---

## 🖌️ Extracted Stroke Variables (40 Strokes)

### Sample Stroke Styles

| Variable | Color | Width | Align | Usage |
|----------|-------|-------|-------|-------|
| `stroke1` | `#00d09e` | 1.61px | inside | Primary border |
| `stroke10` | `#f1fff2` | 2px | center | Light border |
| `stroke11` | `#f1fff2` | 3.26px | inside | Thick light border |
| `stroke12` | `#0068ff` | 4.57px | inside | Blue accent border |
| `stroke13` | `#093030` | 2px | center | Dark teal border |
| `stroke14` | `#f1fff3` | 2px | center | Very light border |

**Total Stroke Variables:** 40 with varying widths (1.61px - 8.66px)

---

## 📐 Extracted Layout Variables (40 Layouts)

### Sample Layout Patterns

| Variable | Mode | Gap | Padding | Alignment |
|----------|------|-----|---------|-----------|
| `layout10` | horizontal | 271px | {top: 9, right: 37, bottom: 9, left: 37} | - |
| `layout11` | horizontal | 13px | {top: 6, right: 29, bottom: 6, left: 31} | center/center |
| `layout12` | horizontal | 13px | {top: 6, right: 29, bottom: 6, left: 31} | center/center |
| `layout13` | horizontal | 24px | {top: 6, right: 14, bottom: 6, left: 14} | center/center |
| `layout14` | vertical | 19px | {top: 11.08, right: 3, bottom: 11.08, left: 3} | - |

### Common Spacing Values Found
- **Gaps:** 10px, 13px, 19px, 24px, 271px
- **Padding:** 3px, 6px, 9px, 11px, 14px, 29px, 31px, 37px
- **Base Unit:** 4px (inferred from multiples)

---

## 🎬 Extracted Animation Data

### Animation Types Used
1. **SMART_ANIMATE** - Smooth transitions between component states
2. **DISSOLVE** - Fade in/out transitions

### Interaction Patterns

| Trigger | Action | Transition | Count |
|---------|--------|------------|-------|
| ON_CLICK | CHANGE_TO | SMART_ANIMATE | 2,708 |
| - | - | DISSOLVE | - |

### Component States (99 Total)

Sample component variants:
- **Home Tab:** "Property 1=Home-On", "Property 1=Home-Off"
- **Analysis Tab:** "Property 1=Analysis-On", "Property 1=Analysis-Off"
- **Toggle:** "Property 1=On", "Property 1=Off"
- **Point:** "Property 1=Empty Point", "Property 1=Fill Point"

---

## 📊 Chart Design Insights

### Spending Chart → Volume Load Chart Mapping

The Figma file contains a "Spending Chart" component in the FinWise design that maps to VoiceFit's "Volume Load Chart":

**FinWise Spending Chart:**
- Shows financial spending over time
- Uses line/area chart visualization
- Color: Mint Green (`#00d09e`)

**VoiceFit Volume Load Chart:**
- Shows training volume over 12 weeks
- Uses line chart visualization
- Color: Forest Green (`#2C5F3D` light, `#4A9B6F` dark)

### Chart Component Specifications

Based on the Figma screens, charts should have:
- **Border Radius:** 16px (`rounded-xl`)
- **Padding:** 16px internal padding
- **Background:** Card background color
- **Elevation:** Level 2 shadow (card elevation)
- **Gap Between Elements:** 24px

---

## 🔧 Implementation Mapping

### Figma Variables → VoiceFit Tokens

| Figma Variable | VoiceFit Token | Value |
|----------------|----------------|-------|
| `fill1` | `primary` (light) | `#2C5F3D` |
| `fill1` | `primary` (dark) | `#4A9B6F` |
| `fill8` | `background` (light) | `#FFFFFF` |
| `fill11` | `background` (dark) | `#1A1A1A` |
| `fill34` | `border` (light) | `#E0E0E0` |
| `fill33` | `border` (dark) | `#333333` |
| `layout13.gap` | `space-6` | 24px |
| `layout11.gap` | `space-3` | 13px |

---

## 📝 Key Findings

1. **Design System Completeness:**
   - ✅ 115 total variables (35 fills, 40 strokes, 40 layouts)
   - ✅ 2,708 prototype interactions
   - ❌ No published components (components are local to file)
   - ❌ No published styles (styles are local to file)

2. **Color System:**
   - FinWise uses Mint Green (`#00d09e`) as primary
   - VoiceFit adapts to Forest Green (`#2C5F3D`)
   - Both use similar teal/blue accent colors

3. **Spacing System:**
   - Base unit appears to be 4px
   - Common gaps: 13px, 24px
   - Common padding: 6px, 14px, 16px

4. **Animation System:**
   - Primarily uses SMART_ANIMATE for smooth transitions
   - 99 component states with variants
   - 4 main prototype flows

5. **Chart Specifications:**
   - Main analytics screen: "7 - A - Quickly Analysis"
   - Charts use 16px border radius
   - 24px gap between chart elements
   - Card-style elevation with shadows

---

## 🔗 References

- **Figma File:** https://www.figma.com/design/Cxy316I7lcSoCVAevLScpm/VF-MVP
- **Existing Design Docs:**
  - `FIGMA_DESIGN_SYSTEM.md` - Consolidated design system
  - `DESIGN_TOKENS_AND_THEME.md` - Complete design tokens
  - `COMPREHENSIVE_UI_IMPLEMENTATION_PLAN.md` - Implementation guide
  - `FIGMA_TO_VOICEFIT_COMPONENT_MAP.md` - Component mappings
- **Phase 2 Audit:** `PHASE_2_FIGMA_AUDIT.md`

---

**Next Steps:**
1. Compare extracted data with existing design system documentation
2. Identify discrepancies between Figma and implementation
3. Update Phase 2 charts to match Figma specifications
4. Create action plan for alignment

