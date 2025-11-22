# Quick Static Analysis Commands

## 🚀 Run Before Every Build

### TypeScript Type Checking (RECOMMENDED)
```bash
cd apps/mobile && npx tsc --noEmit
```
**What it does**: Checks all TypeScript files for type errors, undefined properties, and import issues  
**When to use**: Before every build, before committing code  
**Time**: ~30-60 seconds

### Count Errors Only (Fast Check)
```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep -c "error TS"
```
**What it does**: Shows just the number of errors  
**When to use**: Quick health check

### Show Last 20 Errors
```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | tail -20
```
**What it does**: Shows the most recent errors in the output  
**When to use**: When you want to see what errors exist without scrolling

---

## 📊 Current Status

**Before fixes**: 908 TypeScript errors  
**After token fixes**: 858 TypeScript errors  
**Errors fixed**: 50 errors ✅

### What Was Fixed
1. ✅ Added `tokens.animation.scale.pressed` (fixed ScalePressable crash)
2. ✅ Added `tokens.animation.spring.*` configs
3. ✅ Added `tokens.haptics.*` constants
4. ✅ Added `tokens.colors.accent.primary`, `.success`, `.warning`, `.error`, `.info`
5. ✅ Added `tokens.colors.badge.*` for badge styling
6. ✅ Fixed `tokens.borders` usage in HomeScreen

---

## 🔧 ESLint (Not Yet Configured)

ESLint is not currently set up for this project. To add it:

```bash
# Install ESLint and TypeScript plugins
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-native

# Create eslint.config.js
cat > eslint.config.js << 'EOF'
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
  ],
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
EOF

# Run ESLint
npx eslint . --ext .ts,.tsx
```

---

## 🎯 Recommended Workflow

### Before Starting Work
```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep -c "error TS"
```
Note the baseline error count.

### During Development
Run type check after making significant changes:
```bash
cd apps/mobile && npx tsc --noEmit
```

### Before Committing
```bash
# Full type check
cd apps/mobile && npx tsc --noEmit

# If you set up ESLint
npx eslint . --ext .ts,.tsx --max-warnings 0
```

### Before Building/Running App
```bash
cd apps/mobile && npx tsc --noEmit
```
Fix any new errors before running the app to avoid runtime crashes.

---

## 📝 Pro Tips

1. **Pipe to file for analysis**:
   ```bash
   cd apps/mobile && npx tsc --noEmit > typescript-errors.log 2>&1
   ```

2. **Search for specific errors**:
   ```bash
   cd apps/mobile && npx tsc --noEmit 2>&1 | grep "ScalePressable"
   ```

3. **Count errors by file**:
   ```bash
   cd apps/mobile && npx tsc --noEmit 2>&1 | grep "error TS" | cut -d'(' -f1 | sort | uniq -c | sort -rn
   ```

4. **Add to package.json scripts**:
   ```json
   {
     "scripts": {
       "type-check": "tsc --noEmit",
       "type-check:watch": "tsc --noEmit --watch"
     }
   }
   ```
   Then run: `npm run type-check`

---

## 🐛 Debugging Runtime Errors

When you see a runtime error like "Cannot read property 'X' of undefined":

1. **Run type check first**:
   ```bash
   cd apps/mobile && npx tsc --noEmit 2>&1 | grep "property 'X'"
   ```

2. **Search for the specific property**:
   ```bash
   cd apps/mobile && npx tsc --noEmit 2>&1 | grep -A 3 "ScalePressable"
   ```

3. **Fix the type error** in the source code

4. **Verify the fix**:
   ```bash
   cd apps/mobile && npx tsc --noEmit
   ```

5. **Reload the app** to test

This workflow catches 90% of runtime errors before they happen!

