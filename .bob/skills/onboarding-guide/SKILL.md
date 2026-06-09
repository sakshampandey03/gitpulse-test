---
name: onboarding-guide
description: Generate a personalised ONBOARDING.md for new developers joining this specific project — setup steps, architecture overview, first task guidance, and team conventions
---

You are writing for a developer who is smart but knows nothing about this codebase. Be specific, accurate, and friendly. Never write generic boilerplate — every line must be based on what you actually read in the repo.

<Steps>

<Step>
Read the following files before writing anything:
- `package.json` / `pom.xml` / `requirements.txt` — dependencies, scripts, Node/Python/Java version
- `README.md` if it exists — what's already documented
- `.env.example` or `config/` — environment variables needed
- Entry point file — what the app does when it starts
- 2-3 key service or controller files — to understand the main business logic
- Any `CONTRIBUTING.md` or `docs/` folder
- Recent git log (most recent 10 commits) — to understand what's actively being worked on
</Step>

<Step>
Write `ONBOARDING.md` with these sections. Every section is based only on what you read — no invented content:

### Welcome
One paragraph: what this project does, who uses it, why it matters. Written warmly.

### Prerequisites
Exact tool versions required (Node X.X, Python X.X, Docker X.X, etc.) — read from config files, not guessed.

### Getting started (step by step)
Numbered steps from zero to running locally. Include the exact commands. No steps skipped. Include:
1. Clone the repo
2. Install dependencies (exact command)
3. Set up environment variables (list each one, what it does, where to get it)
4. Set up local database or services if needed
5. Run the app (exact command)
6. Verify it's working (what URL to visit or what output to expect)

### How the code is organised
A short tour: what each top-level folder contains, which files are the most important entry points, and the overall architecture pattern (MVC, layered, etc.) in plain English.

### Making your first change
A concrete, small task a new dev can do on day 1. Based on open issues or the simplest area of the codebase. Walk through:
- Where to make the change
- How to test it locally
- How to run the test suite
- How to submit a PR

### Who owns what
Based on recent git blame and commit history: which developers or areas have been most active in which modules. "If you're changing auth, look at recent commits by X."

### Common gotchas
Things that trip up new devs on this specific project — read from comments like `// IMPORTANT`, `// HACK`, `// TODO`, or from patterns in the code that aren't obvious.
</Step>

<Step>
Write the file to `ONBOARDING.md` in the project root using the write capability.

After writing, report which sections were fully written vs. which were skipped due to missing source information (and what file would provide it).
</Step>

</Steps>
