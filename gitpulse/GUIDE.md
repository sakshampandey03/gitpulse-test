# Complete Guide: Adding GitPulse to Your Enterprise Project

## Prerequisites
1. **Install Bob Shell** from bob.ibm.com
2. **Verify installation**: 
   ```bash
   bob --version
   ```
3. **Git repository** - Your project must be a git repo
4. **Node.js** version 18 or higher

---

## Installation Steps

### Step 1: Copy GitPulse to Your Project
```bash
# Navigate to your enterprise project root
cd /path/to/your-enterprise-project

# Copy the entire gitpulse folder
cp -r /path/to/gitpulse ./gitpulse
```

### Step 2: Install GitPulse Dependencies
```bash
cd gitpulse
npm install
cd ..
```

### Step 3: Make GitPulse Globally Available (Optional but Recommended)
```bash
cd gitpulse
npm link
cd ..
```

After `npm link`, you can use `gitpulse` command from anywhere in your project.

---

## Usage Methods

### Method A: Direct Node Command (No npm link needed)
```bash
# From your project root
node gitpulse/src/index.js check
```

### Method B: Using gitpulse Command (After npm link)
```bash
# From anywhere in your project
gitpulse check
```

---

## Understanding GitPulse Modes

GitPulse supports two execution modes for maximum flexibility:

### Manual Injection Mode (Default) ✅ Recommended

**How it works:**
- GitPulse reads SKILL.md files and injects them as prompts
- Deterministic, predictable results
- Fast execution with reliable JSON output

**Best for:**
- CI/CD pipelines
- Automated workflows
- When you need consistent, repeatable results

**Usage:**
```bash
# Default mode (no flag needed)
node gitpulse/src/index.js check
```

### Native Skills Mode 🤖 Experimental

**How it works:**
- Bob autonomously discovers and uses skills
- More flexible, agentic behavior
- May produce different results each run

**Best for:**
- Local development and exploration
- Interactive analysis
- When you want Bob to choose the best approach

**Usage:**
```bash
# Enable native skills mode
node gitpulse/src/index.js check --native-skills
```

---

## Common Use Cases

### 1. **Analyze All Changed Files (Manual Mode - Default)**
```bash
# Run default checks on all uncommitted changes
node gitpulse/src/index.js check

# Or with npm link
gitpulse check
```

**What it does:**
- Finds all modified files via `git diff`
- Filters out config files (.json, .md, .yaml)
- Runs: security-scan, solid-check, bug-detector, perf-analyzer, test-generator
- Shows results in terminal
- Uses manual injection for predictable results

### 1b. **Analyze with Native Skills Mode**
```bash
# Let Bob discover and use skills autonomously
node gitpulse/src/index.js check --native-skills

# Or with npm link
gitpulse check --native-skills
```

**What it does:**
- Same file discovery as manual mode
- Bob autonomously chooses which skills to apply
- More flexible, exploratory analysis
- Results may vary between runs

### 2. **Run Specific Checks Only**
```bash
# Manual mode (default) - predictable results
node gitpulse/src/index.js check --only security-scan,bug-detector

# Native skills mode - let Bob choose approach
node gitpulse/src/index.js check --native-skills --only security-scan,bug-detector

# Or with npm link
gitpulse check --only security-scan,bug-detector
gitpulse check --native-skills --only security-scan,bug-detector
```

**Available checks:**
- `security-scan` - Security vulnerabilities
- `solid-check` - SOLID principles
- `bug-detector` - Potential bugs
- `perf-analyzer` - Performance issues
- `test-generator` - Generate unit tests

### 3. **Test on Single File (Recommended for First Try)**
```bash
# Analyze just one file to save time/tokens
node gitpulse/src/index.js check --only security-scan --files src/UserService.js

# Or with npm link
gitpulse check --only security-scan --files src/UserService.js
```

### 4. **CI/CD Mode (Compare Against Main Branch)**
```bash
# For CI pipelines - compares current branch vs origin/main
node gitpulse/src/index.js check --ci

# Exits with code 1 if Critical issues found
```

### 5. **Output to JSON Files**
```bash
# Save results to gitpulse-reports/ folder
node gitpulse/src/index.js check --output json

# Or show in terminal AND save to files
node gitpulse/src/index.js check --output both
```

**Output locations:**
- `gitpulse-reports/security-scan.json`
- `gitpulse-reports/bug-detector.json`
- `gitpulse-reports/summary.json`

### 6. **Generate Documentation**
```bash
# Generate README, flowchart, architecture diagram
node gitpulse/src/index.js docs

# Or with npm link
gitpulse docs
```

**Creates:**
- `docs/README.md`
- `docs/flowchart.md`
- `docs/architecture.md`

### 7. **Generate Onboarding Guide**
```bash
node gitpulse/src/index.js onboard

# Creates: docs/ONBOARDING.md
```

### 8. **Convert Code to Another Language**
```bash
node gitpulse/src/index.js convert src/app.js --to python

# Output saved to: gitpulse-reports/converted-app.js
```

---

## Quick Testing Workflow

### First Time Setup:
```bash
# 1. Copy gitpulse to your project
cp -r /path/to/gitpulse ./gitpulse

# 2. Install dependencies
cd gitpulse && npm install && cd ..

# 3. Make a small change to test
echo "// Test comment" >> src/UserService.js

# 4. Run on just that file
node gitpulse/src/index.js check --only security-scan --files src/UserService.js
```

### Regular Usage:
```bash
# 1. Make code changes
vim src/UserService.js

# 2. Run analysis
node gitpulse/src/index.js check

# 3. Review findings in terminal

# 4. Fix issues and commit
git add .
git commit -m "Fix issues found by GitPulse"
```

---

## GitHub Actions Integration

### Step 1: Create Workflow File
Create `.github/workflows/gitpulse.yml`:

```yaml
name: GitPulse Code Review

on:
  pull_request:
    branches: [main, develop]

jobs:
  review:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Need full history for git diff
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Bob Shell
        run: |
          # Add your Bob installation commands here
          # Example: curl -o bob.sh https://bob.ibm.com/install.sh && bash bob.sh
      
      - name: Install GitPulse Dependencies
        run: cd gitpulse && npm install
      
      - name: Run GitPulse Analysis
        env:
          BOB_API_KEY: ${{ secrets.BOB_API_KEY }}
        run: node gitpulse/src/index.js check --ci --output json
      
      - name: Upload Reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: gitpulse-reports
          path: gitpulse-reports/
```

### Step 2: Add Bob API Key to GitHub Secrets
1. Go to your repo → Settings → Secrets and variables → Actions
2. Add new secret: `BOB_API_KEY`
3. Paste your Bob API key

---

## Configuration

### Customize Default Checks
Edit [`gitpulse/src/checks/index.js`](gitpulse/src/checks/index.js:109-114):

```javascript
export const defaultChecks = [
  'security-scan',
  'solid-check',
  'bug-detector',
  'perf-analyzer'
  // Remove or add checks as needed
];
```

### Customize File Filters
Edit [`gitpulse/src/checks/index.js`](gitpulse/src/checks/index.js:10-25):

```javascript

---

## Choosing Between Manual and Native Skills Mode

### Quick Decision Guide

**Use Manual Injection Mode (default) when:**
- ✅ Running in CI/CD pipelines
- ✅ You need consistent, repeatable results
- ✅ Speed is important
- ✅ You want reliable JSON output
- ✅ Running automated workflows

**Use Native Skills Mode when:**
- 🤖 Doing local development and exploration
- 🤖 You want Bob to make intelligent decisions
- 🤖 Trying to discover new insights
- 🤖 Running interactive analysis
- 🤖 Experimenting with different approaches

### Practical Examples

#### CI/CD Pipeline (Use Manual Mode)
```bash
# Predictable, fast, reliable
node gitpulse/src/index.js check --ci --output json

# Always produces structured JSON
# Same results every time
# Exits with code 1 on Critical findings
```

#### Local Development (Try Native Skills)
```bash
# Flexible, exploratory
node gitpulse/src/index.js check --native-skills

# Bob discovers and applies skills
# May produce different insights each run
# Better for interactive analysis
```

#### Pre-commit Hook (Use Manual Mode)
```bash
# Fast, deterministic
node gitpulse/src/index.js check --only security-scan,bug-detector

# Quick feedback before committing
# Consistent results
```

#### Exploratory Analysis (Use Native Skills)
```bash
# Let Bob explore your code
node gitpulse/src/index.js check --native-skills --only perf-analyzer

# Bob may discover performance patterns
# More flexible analysis
```

### Performance Comparison

| Aspect | Manual Mode | Native Skills Mode |
|--------|-------------|-------------------|
| **Speed** | ⚡ Fast | 🐢 Slower (discovery overhead) |
| **Consistency** | ✅ Same results | ⚠️ May vary |
| **Output Format** | ✅ Reliable JSON | ⚠️ Variable |
| **CI/CD Ready** | ✅ Yes | ❌ Not recommended |
| **Flexibility** | ⚠️ Fixed approach | ✅ Adaptive |
| **Best For** | Automation | Exploration |

const isSourceFile = (filePath) => {
  const excluded = [
    'node_modules/',
    '.git/',
    'dist/',
    'build/',
    'coverage/',
    '.json',
    '.md',
    '.txt',
    '.yml',
    '.yaml',
    '.lock',
    'your-custom-pattern/'  // Add your patterns
  ];
  return !excluded.some(pattern => filePath.includes(pattern));
};
```

---

## Troubleshooting

### "Bob Shell not found"
```bash
# Verify Bob is installed
bob --version

# Check PATH
echo $PATH

# Reinstall Bob if needed
```

### "Not a git repository"
```bash
# Initialize git if needed
git init
git add .
git commit -m "Initial commit"
```

### "No changed files"
```bash
# Make sure you have uncommitted changes
git status

# Or use --ci mode to compare branches
node gitpulse/src/index.js check --ci
```

### Too many files being analyzed
```bash
# Commit current changes first
git add .
git commit -m "Checkpoint"

# Then modify just one file for testing
echo "// test" >> src/app.js
node gitpulse/src/index.js check
```

---

## Best Practices

1. **Start Small**: Test on 1-2 files first
2. **Use Specific Checks**: Use `--only` flag to run faster
3. **Commit Often**: Commit changes before running to reduce scope
4. **CI Integration**: Use `--ci` mode in pipelines
5. **Regular Docs**: Run `docs` command monthly
6. **Review Reports**: Check `gitpulse-reports/` for detailed JSON output

---

## Summary of Commands

| Task | Command |
|------|---------|
| Basic check (manual mode) | `node gitpulse/src/index.js check` |
| Native skills mode | `node gitpulse/src/index.js check --native-skills` |
| Specific checks | `node gitpulse/src/index.js check --only security-scan,bug-detector` |
| Native + specific checks | `node gitpulse/src/index.js check --native-skills --only security-scan` |
| Single file | `node gitpulse/src/index.js check --files src/app.js` |
| CI mode (manual) | `node gitpulse/src/index.js check --ci` |
| JSON output | `node gitpulse/src/index.js check --output json` |
| Generate docs | `node gitpulse/src/index.js docs` |
| Onboarding | `node gitpulse/src/index.js onboard` |
| Convert code | `node gitpulse/src/index.js convert file.js --to python` |