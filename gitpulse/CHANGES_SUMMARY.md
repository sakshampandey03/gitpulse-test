# GitPulse Changes Summary

This document summarizes all the architectural changes made to GitPulse, particularly regarding the separation of code quality checks from documentation utilities.

---

## 🎯 Core Architectural Changes

### 1. **Separation of Checks vs Utilities**

**Key Principle:** Code quality checks run on **changed files only** (git diff), while documentation utilities run on **full project context**.

#### Code Quality Checks (via `node src/index.js check`)
- **Scope:** Changed files only (via git diff)
- **Purpose:** PR/commit code review
- **When:** Every PR/commit
- **CI Integration:** ✅ Yes
- **Checks:**
  - `security-scan` - Security vulnerabilities
  - `solid-check` - SOLID principles adherence
  - `bug-detector` - Potential bugs
  - `perf-analyzer` - Performance issues
  - `test-generator` - Unit test generation

#### Documentation Utilities (via separate commands)
- **Scope:** Full project context
- **Purpose:** Documentation generation
- **When:** On-demand
- **CI Integration:** ❌ No
- **Commands:**
  - `node src/index.js docs` - Generate README, flowcharts, architecture
  - `node src/index.js onboard` - Generate onboarding guide
  - `node src/index.js convert` - Convert code between languages

---

## 📁 File Changes

### 1. **src/checks/index.js** (NEW)
**Purpose:** Centralized check definitions and file filtering logic

**Key Features:**
- Defines all available checks with metadata
- File filtering functions (`isSourceFile`, `isCodeFile`, `isNotTestFile`)
- Default checks configuration
- Check validation functions

**File Filters:**
```javascript
// Excludes non-source files
isSourceFile() - Excludes: node_modules/, .git/, dist/, build/, coverage/, 
                           .json, .md, .txt, .yml, .yaml, .lock

// Code files only (multiple languages supported)
isCodeFile() - Includes: .js, .ts, .jsx, .tsx, .java, .py, .go, .rs, 
                        .cpp, .c, .rb, .php, .cs, .swift, .kt

// Non-test files
isNotTestFile() - Excludes: .test., .spec., __tests__/, __test__/
```

**Default Checks:**
```javascript
defaultChecks = [
  'security-scan',
  'solid-check', 
  'bug-detector',
  'perf-analyzer'
]
// Note: test-generator excluded from defaults (runs on-demand)
```

---

### 2. **src/index.js** (UPDATED)
**Changes:**
- Imports check definitions from `src/checks/index.js`
- Uses file filters for each check
- Separated commands: `check`, `docs`, `onboard`, `convert`
- Each command has distinct purpose and scope

**Command Structure:**

#### `node src/index.js check` (Code Quality)
```bash
node src/index.js check [--only <checks>] [--ci] [--output <format>]
# Options:
--only <checks>     # Comma-separated list of checks
--ci                # CI mode: git diff origin/main...HEAD
--output <format>   # terminal, json, or both
```

**Workflow:**
1. Validate git repository
2. Get changed files via git diff
3. Filter files per check requirements
4. Run Bob skills on filtered files
5. Generate reports (terminal/JSON)
6. Exit with code 1 if Critical findings in CI mode

#### `node src/index.js docs` (Documentation)
```bash
node src/index.js docs
# No options - analyzes full project
```

**Generates:**
- `docs/README.md` - Project documentation
- `docs/flowchart.md` - Code flowcharts
- `docs/architecture.md` - Architecture diagrams

#### `node src/index.js onboard` (Onboarding)
```bash
node src/index.js onboard
# No options - analyzes full project
```

**Generates:**
- `docs/ONBOARDING.md` - Developer onboarding guide

#### `node src/index.js convert` (Code Conversion)
```bash
node src/index.js convert <file> --to <language>
```

**Output:** `gitpulse-reports/converted-{filename}`

---

### 3. **src/runBob.js** (UNCHANGED)
**Purpose:** Wrapper for Bob Shell execution

**Key Features:**
- Validates skill names
- Reads SKILL.md files from `.bob/skills/`
- Executes Bob with proper arguments
- Handles JSON/Markdown output formats
- Error handling and validation

**Working Directory:** Always runs from current working directory (CWD)

---

### 4. **action-runner.js** (UNCHANGED)
**Purpose:** GitHub Action entry point

**Workflow:**
1. Get inputs (bob_api_key, checks, fail_on)
2. Set BOB_API_KEY environment variable
3. Run `node src/index.js check --ci --only <checks> --output json`
4. Read summary.json
5. Format findings as GitHub-flavored Markdown
6. Post comment to PR
7. Fail if findings meet severity threshold

---

## 🔧 Working Directory Behavior

### For Code Quality Checks (`node src/index.js check`)
- **CWD:** User's current directory (where command is run)
- **Git Diff:** Relative to CWD
- **File Paths:** Relative to CWD
- **Bob Execution:** From CWD

### For Documentation Utilities (`docs`, `onboard`, `convert`)
- **CWD:** User's current directory (where command is run)
- **File Analysis:** Full project from CWD
- **Output:** `docs/` directory in CWD
- **Bob Execution:** From CWD

### For Demo Project
- **Demo CWD:** `gitpulse/demo/`
- **Commands:** Run from demo directory
- **Git Diff:** Analyzes demo files only
- **Reports:** Saved to `demo/gitpulse-reports/`

**Example:**
```bash
cd gitpulse/demo
node ../src/index.js check  # Analyzes demo/src/UserService.js changes
```

---

## 📊 Check Configurations

| Check | Skill Name | Output Format | File Filter | Description |
|-------|-----------|---------------|-------------|-------------|
| security-scan | security-scan | JSON | isSourceFile | Security vulnerabilities |
| solid-check | solid-check | JSON | isCodeFile + isSourceFile | SOLID principles |
| bug-detector | bug-detector | JSON | isSourceFile | Potential bugs |
| perf-analyzer | perf-analyzer | JSON | isSourceFile | Performance issues |
| test-generator | test-generator | Markdown | isSourceFile + isNotTestFile | Unit test generation |

---

## 🎯 Key Design Decisions

### 1. **Why Exclude Utilities from Default Checks?**
- Documentation utilities (readme-writer, flowchart, etc.) need **full project context**
- Code quality checks need **only changed files** for efficiency
- Mixing them would cause confusion and performance issues

### 2. **Why Separate Commands?**
- Clear separation of concerns
- Different use cases (PR review vs documentation)
- Better user experience
- Easier to maintain and extend

### 3. **Why File Filters?**
- Not all checks apply to all files
- Improves performance (skip irrelevant files)
- Reduces noise in reports
- Example: SOLID check only runs on code files, not JSON/MD

### 4. **Why Default Checks Exclude test-generator?**
- Test generation is slower
- Not always needed for every commit
- Users can run explicitly with `--only test-generator`
- Keeps default checks fast and focused

---

## 📝 Documentation Updates

### README.md ✅
- **Section "Available Checks"** - Lists all 10 checks with descriptions
- **Section "Default checks"** - Clarifies which run automatically
- **Section "CLI Commands"** - Documents all commands with options
- **Section "How It Works"** - Explains git diff analysis and filtering

### COMMANDS.md ✅
- **Section "Code Quality Checks"** - Documents `check` command
- **Section "Documentation Utilities"** - Documents `docs`, `onboard`, `convert`
- **Section "Key Differences"** - Table comparing check vs utilities
- **Section "Available Checks"** - Lists all checks with file filters
- **Section "Default Checks"** - Clarifies automatic vs on-demand

### demo/README.md ✅
- **Section "Running the Demo"** - Shows how to run from demo directory
- **Section "Expected Output"** - Documents findings by severity
- **Section "What GitPulse Will Find"** - Lists issues per check

### DEMO_SCRIPT.md ✅
- **Section 1: Local CLI Demo** - Step-by-step walkthrough
- **Section 2: GitHub Action Demo** - PR review workflow
- **Section 3: Advanced Features** - Specific checks, CI mode, output formats
- **Troubleshooting** - Common issues and solutions

### action.yml ✅
- **Input: checks** - Default value lists all checks
- **Input: fail_on** - Severity threshold for CI failure
- **Branding** - Shield icon, blue color

---

## 🧪 Testing Commands

### Test Code Quality Checks
```bash
# From gitpulse/demo directory
cd demo
echo "// Test" >> src/UserService.js
node ../src/index.js check                                    # All default checks
node ../src/index.js check --only security-scan               # Single check
node ../src/index.js check --only security-scan,bug-detector  # Multiple checks
node ../src/index.js check --output json                      # JSON output
node ../src/index.js check --output both                      # Terminal + JSON
```

### Test Documentation Utilities
```bash
# From gitpulse/demo directory
cd demo
node ../src/index.js docs      # Generate all docs
node ../src/index.js onboard   # Generate onboarding guide
node ../src/index.js convert src/UserService.js --to python
```

### Test CI Mode
```bash
# From gitpulse directory (not demo)
cd gitpulse
node src/index.js check --ci  # Compare against origin/main
```

---

## ✅ Verification Checklist

- [x] Checks defined in `src/checks/index.js`
- [x] File filters implemented correctly
- [x] Default checks exclude utilities
- [x] Commands separated (`check`, `docs`, `onboard`, `convert`)
- [x] README.md documents all checks and commands
- [x] COMMANDS.md explains differences
- [x] demo/README.md shows demo workflow
- [x] DEMO_SCRIPT.md has comprehensive walkthrough
- [x] action.yml has correct defaults
- [x] Working directory behavior documented
- [x] All file paths relative to CWD

---

## 🚀 Summary

**What Changed:**
1. Created `src/checks/index.js` for centralized check definitions
2. Separated code quality checks from documentation utilities
3. Implemented file filtering per check requirements
4. Updated all documentation to reflect new architecture
5. Clarified working directory behavior for each command

**Why It Matters:**
- **Performance:** Only analyze relevant files
- **Clarity:** Clear separation of concerns
- **Flexibility:** Users can run specific checks
- **Maintainability:** Easier to add new checks
- **User Experience:** Better documentation and examples

**Key Takeaway:**
GitPulse now has a clear distinction between **code quality checks** (for PR/commit reviews on changed files) and **documentation utilities** (for full project analysis on-demand).

---

**Made with Bob** 🚀