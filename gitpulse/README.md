# 🛡️ GitPulse

> AI-powered code quality analysis for your git diffs, powered by IBM Bob Shell

GitPulse is a CLI tool and GitHub Action that automatically reviews code changes using AI-powered analysis. It runs security scans, checks SOLID principles, detects bugs, analyzes performance, and generates tests—all on your git diffs.

[![Made with Bob](https://img.shields.io/badge/Made%20with-Bob-blue)](https://bob.ibm.com)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)

---

## ✨ Features

- 🔍 **10 AI-Powered Checks** — Security scanning, SOLID principles, bug detection, performance analysis, and more
- 🚀 **CLI Tool** — Run checks locally on unstaged/staged changes or in CI on branch diffs
- 🤖 **GitHub Action** — Automated PR reviews with inline comments
- 🎯 **Smart Filtering** — Only analyzes changed files, not your entire codebase
- 📊 **Multiple Output Formats** — Terminal (color-coded), JSON reports, or both
- 🔧 **Extensible** — Add custom Bob skills and checks
- ⚡ **Fast** — Parallel execution and intelligent caching

---

## 📦 Installation

### Prerequisites

1. **Node.js 18+** — [Download here](https://nodejs.org)
2. **Git** — [Download here](https://git-scm.com)
3. **Bob Shell** — Install from [bob.ibm.com](https://bob.ibm.com)
4. **Bob API Key** — Get yours at [bob.ibm.com/account](https://bob.ibm.com/account)

### Install GitPulse

Since GitPulse is not yet published to npm, install it directly from the repository:

```bash
# Clone the repository
git clone https://github.com/your-username/gitpulse.git
cd gitpulse

# Install dependencies
npm install

# Link globally to use 'gitpulse' command anywhere
npm link
```

**Alternative: Install from GitHub URL**
```bash
npm install -g git+https://github.com/your-username/gitpulse.git
```

### Set Up Your API Key

```bash
export BOB_API_KEY="your-api-key-here"
```

Add this to your `~/.bashrc` or `~/.zshrc` to persist across sessions.

---

## 🚀 Quick Start

```bash
# Navigate to your git repository
cd your-project

# Make some changes to your code
# ... edit files ...

# Run GitPulse checks on your changes
node src/index.js check

# View results in terminal with color-coded severity levels
```

**Note:** Use `node src/index.js` to run commands, or install globally with `npm link` to use `gitpulse` command directly.

That's it! GitPulse will analyze your changed files and show you findings.

---

## 📖 Usage

### CLI Commands

#### `node src/index.js check`

Run code analysis checks on changed files.

```bash
# Check unstaged changes (default - manual injection mode)
node src/index.js check

# Check specific checks only
node src/index.js check --only security-scan,bug-detector

# Native skills mode (let Bob discover and use skills autonomously)
node src/index.js check --native-skills

# CI mode: compare branch to main
node src/index.js check --ci

# Combined flags
node src/index.js check --native-skills --only security-scan,bug-detector

# Output as JSON
node src/index.js check --output json

# Output to both terminal and JSON
node src/index.js check --output both
```

**Options:**
- `--only <checks>` — Comma-separated list of checks to run
- `--native-skills` — Enable native skills mode (Bob discovers and uses skills autonomously)
- `--ci` — CI mode: uses `git diff origin/main...HEAD`, exits with code 1 if Critical findings
- `--output <format>` — Output format: `terminal` (default), `json`, or `both`

#### `node src/index.js docs`

Generate project documentation.

```bash
node src/index.js docs
```

Generates:
- README with project overview
- Flowcharts for code logic
- Architecture diagrams

#### `node src/index.js onboard`

Create developer onboarding guide.

```bash
node src/index.js onboard
```

Generates a comprehensive onboarding document for new developers.

#### `node src/index.js convert`

Convert code to another language.

```bash
node src/index.js convert src/app.js --to python
```

Converts the specified file to the target language and saves to `gitpulse-reports/`.

---

## 🔍 Available Checks

| Check | Description | Output Format |
|-------|-------------|---------------|
| **security-scan** | Scans for security vulnerabilities and unsafe patterns | JSON |
| **solid-check** | Analyzes code adherence to SOLID principles | JSON |
| **bug-detector** | Detects potential bugs and code issues | JSON |
| **perf-analyzer** | Analyzes code performance and suggests optimizations | JSON |
| **test-generator** | Generates unit tests for source files | Markdown |
| **readme-writer** | Generates or updates project README | Markdown |
| **flowchart** | Creates flowcharts for code logic | Markdown |
| **architecture-diagram** | Generates system architecture diagrams | Markdown |
| **onboarding-guide** | Creates developer onboarding documentation | Markdown |
| **code-converter** | Converts code between languages | Markdown |

**Default checks** (run automatically): `security-scan`, `solid-check`, `bug-detector`, `perf-analyzer`

**Note:** Documentation utilities (`readme-writer`, `flowchart`, `architecture-diagram`, `onboarding-guide`, `code-converter`) are NOT included in checks and must be run via separate commands (`node src/index.js docs`, `node src/index.js onboard`, `node src/index.js convert`).

---

## 🤖 GitHub Action

Add GitPulse to your GitHub workflows for automated PR reviews.

### Setup

1. **Add workflow file** — Create `.github/workflows/gitpulse.yml`:

```yaml
name: GitPulse Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Fetch full history for git diff
      
      - name: GitPulse Review
        uses: your-org/gitpulse@v1
        with:
          bob_api_key: ${{ secrets.BOB_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          checks: 'security-scan,solid-check,bug-detector,perf-analyzer,test-generator'
          fail_on: 'critical'
```

2. **Add secrets** — Go to your repo's Settings → Secrets and add:
   - `BOB_API_KEY` — Your Bob API key from [bob.ibm.com/account](https://bob.ibm.com/account)

### Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `bob_api_key` | IBM Bob API key | ✅ Yes | — |
| `github_token` | GitHub token for posting comments | No | `${{ github.token }}` |
| `checks` | Comma-separated list of checks | No | All default checks |
| `fail_on` | Fail if findings at this severity or above | No | `critical` |

### Example PR Comment

When GitPulse runs on a PR, it posts a comment like this:

```markdown
## 🛡️ GitPulse Review

**Found 3 issue(s):** 🔴 1 Critical • 🟠 1 High • 🟡 1 Medium

| Severity | Check | Issue | Line | Fix |
|----------|-------|-------|------|-----|
| 🔴 Critical | security-scan | Hardcoded API key | 42 | Use environment variables |
| 🟠 High | solid-check | God class violation | 15 | Split into smaller classes |
| 🟡 Medium | bug-detector | Potential null dereference | 89 | Add null check |

---
*Powered by [GitPulse](https://github.com/your-org/gitpulse) with IBM Bob Shell*
```

---

## ⚙️ Configuration

### Environment Variables

- `BOB_API_KEY` — Your Bob API key (required)
- `GITPULSE_BASE_BRANCH` — Base branch for CI mode (default: `origin/main`)

```bash
export BOB_API_KEY="your-api-key"
export GITPULSE_BASE_BRANCH="origin/develop"
```

### Custom Skills

GitPulse uses Bob skills located in `.bob/skills/`. Each check corresponds to a skill:

```
.bob/
└── skills/
    ├── security-scan/
    │   └── SKILL.md
    ├── solid-check/
    │   └── SKILL.md
    └── ...
```

You can customize these skills or add your own.

### Custom Modes & Rules

- **Custom Modes** — Define in `.bob/custom_modes.yaml`
- **Custom Rules** — Add to `.bob/rules/`

---

## 🏗️ How It Works

1. **Git Diff Analysis** — GitPulse uses `git diff` to identify changed files
2. **Smart Filtering** — Filters files based on check requirements (e.g., only code files for SOLID check)
3. **Bob Shell Integration** — Passes files to Bob Shell with custom skills
4. **AI Analysis** — Bob analyzes code using AI models
5. **Report Generation** — Results are formatted and displayed/saved

```
┌─────────────┐
│  Git Diff   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Filter    │
│   Files     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Bob Shell  │
│  + Skills   │
└──────┬──────┘
       │

---

## 🔄 Hybrid Approach: Manual vs Native Skills

GitPulse supports two modes for skill execution, giving you flexibility based on your use case:

### Manual Injection Mode (Default) ✅ Recommended for CI/CD

**How it works:**
- GitPulse reads SKILL.md files from `.bob/skills/` directory
- Skills are injected as prompts directly into Bob's context
- Bob executes the skills with deterministic, predictable behavior

**Advantages:**
- ✅ **Deterministic** - Same input produces consistent results
- ✅ **Fast** - Direct skill execution without discovery overhead
- ✅ **Reliable** - Predictable JSON output format
- ✅ **CI/CD Ready** - Perfect for automated pipelines

**Usage:**
```bash
# Default mode (no flag needed)
node src/index.js check

# Recommended for CI/CD
node src/index.js check --ci
```

### Native Skills Mode 🤖 Experimental

**How it works:**
- Bob autonomously discovers available skills in `.bob/skills/`
- Bob decides which skills to use and how to apply them
- More flexible, agentic behavior with potential for varied results

**Advantages:**
- ✅ **Flexible** - Bob adapts approach based on context
- ✅ **Agentic** - Bob makes intelligent decisions about skill usage
- ✅ **Exploratory** - Better for interactive analysis and discovery

**Trade-offs:**
- ⚠️ **Non-deterministic** - Results may vary between runs
- ⚠️ **Slower** - Skill discovery adds overhead
- ⚠️ **Variable Output** - May not always produce structured JSON

**Usage:**
```bash
# Enable native skills mode
node src/index.js check --native-skills

# Combined with specific checks
node src/index.js check --native-skills --only security-scan,bug-detector
```

### When to Use Each Mode

| Use Case | Recommended Mode | Reason |
|----------|------------------|--------|
| **CI/CD Pipelines** | Manual Injection (default) | Consistent, reliable results |
| **Automated Workflows** | Manual Injection (default) | Predictable behavior |
| **Pre-commit Hooks** | Manual Injection (default) | Fast execution |
| **Local Development** | Native Skills | Flexible, exploratory analysis |
| **Interactive Analysis** | Native Skills | Bob chooses best approach |
| **Experimentation** | Native Skills | Discover new insights |

### Example Comparison

**Manual Injection (Default):**
```bash
# Predictable, fast, CI-ready
node src/index.js check --ci
# ✅ Always produces structured JSON
# ✅ Same results every time
# ✅ Exits with code 1 on Critical findings
```

**Native Skills:**
```bash
# Flexible, agentic, exploratory
node src/index.js check --native-skills
# 🤖 Bob discovers and applies skills
# 🤖 May produce different insights each run
# 🤖 Better for local development
```

       ▼
┌─────────────┐
│   Report    │
│  Terminal   │
│    JSON     │
└─────────────┘
```

---

## 🧪 Try the Demo

Want to see GitPulse in action? The `/demo` directory contains a sample application with **intentional code issues** that GitPulse will detect!

### What's in the Demo?

The demo includes a [`UserService.js`](../demo/src/UserService.js) file with planted issues:
- 🔒 **Security vulnerabilities** - Hardcoded API keys
- 🐛 **Bugs** - Null dereferences, missing error handling
- 🏗️ **SOLID violations** - God class, SRP violations
- ⚡ **Performance issues** - O(n²) algorithms

### Quick Demo

```bash
# Clone the repo (replace with your actual repository URL)
git clone https://github.com/your-username/gitpulse.git
cd gitpulse

# Install dependencies and link globally
npm install
npm link

# Navigate to demo app
cd demo

# Make a change to trigger analysis
echo "// Test" >> src/UserService.js

# Run GitPulse checks
node src/index.js check

# See all the planted issues detected! 🎯
```

### Learn More

- 📖 [Demo README](../demo/README.md) - Detailed demo documentation
- 📝 [Demo Script](./DEMO_SCRIPT.md) - Comprehensive walkthrough with expected output
- 🎓 [Demo Video](https://bob.ibm.com) - Watch GitPulse in action

---

## 🛠️ Development

### Project Structure

```
gitpulse/
├── src/
│   ├── index.js           # CLI entry point
│   ├── runBob.js          # Bob Shell wrapper
│   ├── gitDiff.js         # Git integration
│   ├── reporter.js        # Output formatting
│   └── checks/
│       └── index.js       # Check definitions
├── .bob/
│   ├── skills/            # 10 SKILL.md files
│   ├── custom_modes.yaml  # Custom modes
│   └── rules/             # Custom rules
├── action.yml             # GitHub Action metadata
├── action-runner.js       # GitHub Action entry point
└── demo/                  # Demo app with planted issues
```

### Running Locally

```bash
# Clone the repo (replace with your actual repository URL)
git clone https://github.com/your-username/gitpulse.git
cd gitpulse

# Install dependencies
npm install

# Link for local development (makes 'gitpulse' command available globally)
npm link

# Test it works
gitpulse --help

# Run on demo app
cd demo
node src/index.js check
```

### Adding a New Check

1. Create a new skill in `.bob/skills/your-check/SKILL.md`
2. Add check definition to `src/checks/index.js`:

```javascript
'your-check': {
  skillName: 'your-check',
  label: 'Your Check',
  outputFormat: 'json',
  fileFilter: isCodeFile,
  description: 'Your check description'
}
```

3. Test it:

```bash
node src/index.js check --only your-check
```

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🙏 Credits

**Made with [Bob](https://bob.ibm.com)** — IBM's AI-powered development assistant

GitPulse leverages Bob Shell's powerful AI capabilities to provide intelligent code analysis and suggestions.

---

## 🔗 Links

- [Bob Shell](https://bob.ibm.com)
- [Demo Script](./DEMO_SCRIPT.md)
- [GitHub Action Marketplace](https://github.com/marketplace)
- [Report Issues](https://github.com/your-org/gitpulse/issues)

---

**Happy Coding! 🚀**