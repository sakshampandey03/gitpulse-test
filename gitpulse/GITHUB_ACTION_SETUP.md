# GitHub Action Setup Guide - API Mode

This guide shows how to set up GitPulse as a GitHub Action using Bob's API (no CLI installation required).

## Step 1: Create Test Repository

1. Go to GitHub and create a new repository (e.g., `gitpulse-test`)
2. Clone it locally:
```bash
cd ~/Documents
git clone https://github.com/YOUR_USERNAME/gitpulse-test.git
cd gitpulse-test
```

## Step 2: Copy GitPulse into Test Repo

```bash
# Copy the entire gitpulse folder
cp -r /Users/saksham/Documents/Bobathon/gitpulse .

# Clean up unnecessary files
rm -rf gitpulse/node_modules
rm -rf gitpulse/gitpulse-reports
rm -rf gitpulse/demo
```

## Step 3: Create GitHub Workflow

Create `.github/workflows/gitpulse.yml`:

```yaml
name: GitPulse PR Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Fetch all history for git diff
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install GitPulse Dependencies
        run: |
          cd gitpulse
          npm install
      
      - name: Run GitPulse Review (API Mode)
        run: |
          cd gitpulse
          node src/index.js check --ci --output both
        env:
          BOB_API_KEY: ${{ secrets.BOB_API_KEY }}
          CI: true
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Step 4: Add GitHub Secret

1. Go to your repository on GitHub
2. Navigate to: Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add:
   - **Name**: `BOB_API_KEY`
   - **Secret**: Your Bob API key from bob.ibm.com/account

## Step 5: Add Test Code

Create some test files with intentional issues:

```bash
mkdir -p src
cat > src/test.js << 'EOF'
// Test file with security issues
const API_KEY = "hardcoded-secret-12345";

function getUserData(userId) {
  // Bug: No null check
  const user = users.find(u => u.id === userId);
  return user.name;
}

// Performance issue: O(n²)
function findDuplicates(arr) {
  const dupes = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) {
        dupes.push(arr[i]);
      }
    }
  }
  return dupes;
}
EOF
```

## Step 6: Push and Create PR

```bash
# Push initial setup
git add .
git commit -m "Add GitPulse action and test code"
git push origin main

# Create feature branch
git checkout -b test-feature
echo "// test change" >> src/test.js
git add src/test.js
git commit -m "Test change"
git push origin test-feature
```

## Step 7: Create Pull Request

1. Go to your repository on GitHub
2. Click "Compare & pull request"
3. Create the PR

## Step 8: Verify Action Runs

1. Go to the "Actions" tab
2. Click on the running workflow
3. Expand "Run GitPulse Review (API Mode)" step
4. You should see:
   ```
   ℹ️  Running in CI mode with API key - will use Bob API
   ℹ️  Bob CLI not available, using API mode...
   Found X changed file(s)
   Running checks: security-scan, bug-detector...
   ```

## Expected Output

The action will:
- ✅ Detect changed files using git diff
- ✅ Run security scans, bug detection, etc.
- ✅ Use Bob API (no CLI required)
- ✅ Generate JSON reports
- ✅ Display findings in the action logs

## Troubleshooting

### Error: "BOB_API_KEY environment variable is required"
- Verify the secret is added in GitHub Settings → Secrets
- Check the secret name is exactly `BOB_API_KEY`

### Error: "Failed to connect to Bob API"
- Check your API key is valid
- Verify network connectivity
- Check if Bob API endpoint is accessible

### No files analyzed
- Ensure your PR has actual code changes
- Check `fetch-depth: 0` is set in checkout step
- Verify git diff is working: add a debug step with `git diff origin/main...HEAD --name-only`

## API Mode vs CLI Mode

**API Mode** (used in GitHub Actions):
- ✅ No Bob CLI installation required
- ✅ Works in any CI/CD environment
- ✅ Only needs BOB_API_KEY
- ⚠️ Requires network access to Bob API

**CLI Mode** (local development):
- ✅ Faster execution
- ✅ Works offline (after initial setup)
- ⚠️ Requires Bob Shell installation

GitPulse automatically detects which mode to use based on environment.