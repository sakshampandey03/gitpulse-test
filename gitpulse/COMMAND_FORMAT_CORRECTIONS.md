# Command Format Corrections

**Date:** 2026-06-09  
**Issue:** Documentation incorrectly used `gitpulse` command instead of `node src/index.js`

---

## 🎯 Problem Identified

The documentation across multiple files was using `gitpulse` as the command, which only works after running `npm link`. The actual command that works without installation is `node src/index.js`.

---

## ✅ Files Corrected

### 1. **README.md**
**Changes Made:**
- Updated Quick Start section to use `node src/index.js check`
- Added note about `npm link` for global installation
- Updated all command examples in CLI Commands section
- Updated demo examples
- Updated development section

**Command Format:**
```bash
# From project root
node src/index.js check
node src/index.js docs
node src/index.js onboard
node src/index.js convert <file> --to <language>
```

---

### 2. **demo/README.md**
**Changes Made:**
- Updated Running the Demo section
- Changed command from `gitpulse check` to `node ../src/index.js check`
- Updated prerequisites to remove global installation requirement

**Command Format:**
```bash
# From demo/ directory
node ../src/index.js check
node ../src/index.js docs
node ../src/index.js onboard
node ../src/index.js convert <file> --to <language>
```

**Note:** Uses `../src/index.js` because demo is a subdirectory

---

### 3. **DEMO_SCRIPT.md**
**Changes Made:**
- Updated all command examples throughout the file
- Fixed Quick Start section
- Updated Feature demonstrations
- Updated Troubleshooting examples
- Updated Best Practices section

**Command Format:**
```bash
# From demo/ directory
node ../src/index.js check
node ../src/index.js check --only security-scan
node ../src/index.js check --ci
node ../src/index.js check --output json
node ../src/index.js docs
node ../src/index.js onboard
node ../src/index.js convert <file> --to <language>
```

---

### 4. **CHANGES_SUMMARY.md**
**Changes Made:**
- Updated all command references
- Fixed command examples in testing section
- Updated working directory examples

---

### 5. **VERIFICATION_REPORT.md**
**Changes Made:**
- Updated all command references
- Fixed testing commands section
- Updated verification checklist examples

---

### 6. **COMMANDS.md**
**Status:** ✅ Already Correct
- This file was already using `node src/index.js` format
- No changes needed

---

## 📋 Correct Command Formats

### From Project Root (`gitpulse/`)
```bash
node src/index.js check
node src/index.js check --only security-scan,bug-detector
node src/index.js check --ci
node src/index.js check --output json
node src/index.js docs
node src/index.js onboard
node src/index.js convert <file> --to <language>
```

### From Demo Directory (`gitpulse/demo/`)
```bash
node ../src/index.js check
node ../src/index.js check --only security-scan
node ../src/index.js check --ci
node ../src/index.js docs
node ../src/index.js onboard
node ../src/index.js convert <file> --to <language>
```

### After Global Installation (`npm link`)
```bash
gitpulse check
gitpulse docs
gitpulse onboard
gitpulse convert <file> --to <language>
```

**Note:** The `gitpulse` command only works after running `npm link` from the project root.

---

## 🔧 How npm link Works

The `package.json` file defines:
```json
{
  "bin": {
    "gitpulse": "./src/index.js"
  }
}
```

When you run `npm link`:
1. Creates a symlink in global node_modules
2. Makes `gitpulse` command available globally
3. Points to `./src/index.js` in your local directory

**Without npm link:**
- Must use `node src/index.js` directly
- This is the default for development and testing

---

## 📊 Summary of Changes

| File | Lines Changed | Status |
|------|---------------|--------|
| README.md | ~15 locations | ✅ Fixed |
| demo/README.md | ~5 locations | ✅ Fixed |
| DEMO_SCRIPT.md | ~40 locations | ✅ Fixed |
| CHANGES_SUMMARY.md | ~10 locations | ✅ Fixed |
| VERIFICATION_REPORT.md | ~10 locations | ✅ Fixed |
| COMMANDS.md | 0 (already correct) | ✅ Verified |

**Total:** ~80 command references corrected

---

## ✅ Verification

All documentation now correctly uses:
- `node src/index.js` when running from project root
- `node ../src/index.js` when running from demo directory
- Includes notes about `npm link` for global installation

---

## 🎯 Key Takeaways

1. **Default Command:** `node src/index.js <command>`
2. **From Demo:** `node ../src/index.js <command>`
3. **After npm link:** `gitpulse <command>`
4. **Documentation:** Now accurately reflects actual usage
5. **Consistency:** All files use the same command format

---

**Made with Bob** 🚀