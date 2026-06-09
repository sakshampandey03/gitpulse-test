# GitPulse Commands Reference

> **Note:** GitPulse is not installed globally yet. Use `node src/index.js` to run commands.

## Code Quality Checks (for PR/Commit Reviews)

### `node src/index.js check`
Runs code quality checks on **changed files only** (via git diff).

**Available Checks:**
- `security-scan` - Scans for security vulnerabilities and unsafe patterns
- `solid-check` - Analyzes code adherence to SOLID principles
- `bug-detector` - Detects potential bugs and code issues
- `perf-analyzer` - Analyzes code performance and suggests optimizations
- `test-generator` - Generates unit tests for source files

**Default Checks** (run when no --only specified):
- security-scan
- solid-check
- bug-detector
- perf-analyzer

**Execution Modes:**
- **Manual Injection (Default)**: Reads SKILL.md files and injects as prompts - deterministic, fast, CI-ready
- **Native Skills**: Bob discovers and uses skills autonomously - flexible, exploratory, may vary

**Usage:**
```bash
# Run all default checks (manual injection mode)
node src/index.js check

# Run with native skills mode (Bob discovers skills)
node src/index.js check --native-skills

# Run specific checks only
node src/index.js check --only security-scan,bug-detector

# Native skills with specific checks
node src/index.js check --native-skills --only security-scan,bug-detector

# CI mode (compare against origin/main, exit 1 on Critical findings)
node src/index.js check --ci

# Save results to JSON files
node src/index.js check --output json

# Display in terminal AND save to files
node src/index.js check --only test-generator --output both
```

**Flags:**
- `--native-skills` - Enable native skills mode (Bob discovers and uses skills autonomously)
- `--only <checks>` - Comma-separated list of checks to run
- `--ci` - CI mode: compare against origin/main, exit 1 on Critical findings
- `--output <format>` - Output format: `terminal` (default), `json`, or `both`

**Output:**
- Terminal: Color-coded findings with severity levels
- JSON: Saved to `gitpulse-reports/{check-name}.json`
- Markdown: Saved to `gitpulse-reports/{check-name}.md` (for test-generator)

### When to Use Each Mode

**Use Manual Injection (Default) for:**
- ✅ CI/CD pipelines - consistent, repeatable results
- ✅ Automated workflows - predictable behavior
- ✅ Pre-commit hooks - fast execution
- ✅ When you need reliable JSON output

**Use Native Skills for:**
- 🤖 Local development - flexible, exploratory analysis
- 🤖 Interactive analysis - Bob chooses best approach
- 🤖 Experimentation - discover new insights
- 🤖 When you want Bob to make intelligent decisions

**Example Comparison:**
```bash
# Manual mode (default) - Recommended for CI/CD
node src/index.js check --ci
# ✅ Deterministic results
# ✅ Fast execution
# ✅ Reliable JSON output

# Native skills mode - Better for local development
node src/index.js check --native-skills
# 🤖 Bob discovers and applies skills
# 🤖 More flexible analysis
# 🤖 May produce different insights each run
```


---

## Documentation Utilities (Full Project Context)

These commands analyze the **entire project**, not just changed files.

### `node src/index.js docs`
Generates comprehensive project documentation and saves to `docs/` directory.

**Generates:**
- `docs/README.md` - Project documentation
- `docs/flowchart.md` - Code flowcharts with Mermaid diagrams
- `docs/architecture.md` - System architecture with Mermaid diagrams

**Usage:**
```bash
node src/index.js docs
```

**Output Location:** All files are saved to the `docs/` directory in your project root.

### `node src/index.js onboard`
Creates developer onboarding guide and saves to `docs/` directory.

**Generates:**
- `docs/ONBOARDING.md` - Comprehensive onboarding guide for new developers

**Usage:**
```bash
node src/index.js onboard
```

**Output Location:** Saved to `docs/ONBOARDING.md`

### `node src/index.js convert <file> --to <language>`
Converts a code file to another programming language.

**Usage:**
```bash
node src/index.js convert src/app.js --to python
node src/index.js convert main.py --to typescript
```

**Output:** Saved to `gitpulse-reports/converted-{filename}`

---

## Key Differences

| Feature | `check` Command | `docs`/`onboard`/`convert` |
|---------|----------------|---------------------------|
| **Scope** | Changed files only | Full project context |
| **Purpose** | Code quality review | Documentation/conversion |
| **When to use** | Every PR/commit | On-demand, when needed |
| **CI Integration** | ✅ Yes | ❌ No |
| **Git diff** | ✅ Required | ❌ Not used |

---

## Examples

### Pre-commit Hook (Manual Mode)
```bash
# Run quality checks before committing - fast and deterministic
node src/index.js check
```

### CI/CD Pipeline (Manual Mode - Recommended)
```bash
# Run in CI mode (fails on Critical findings)
node src/index.js check --ci --output json
# ✅ Consistent results for automated workflows
```

### Local Development (Native Skills)
```bash
# Let Bob explore and analyze your code
node src/index.js check --native-skills
# 🤖 Flexible, exploratory analysis
```

### Targeted Analysis (Both Modes)
```bash
# Manual mode - predictable security scan
node src/index.js check --only security-scan,bug-detector

# Native skills - Bob chooses approach
node src/index.js check --native-skills --only security-scan,bug-detector
```

### Generate Documentation
```bash
# Update project docs
node src/index.js docs

# Create onboarding guide for new developers
node src/index.js onboard
```

### Code Conversion
```bash
# Convert JavaScript to Python
node src/index.js convert src/utils.js --to python
```

---

## Installing Globally (Optional)

To use `gitpulse` command directly without `node src/index.js`:

```bash
# From the gitpulse directory
npm link

# Now you can use:
gitpulse check
gitpulse docs
# etc.
```