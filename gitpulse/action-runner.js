import * as core from '@actions/core';
import * as github from '@actions/github';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

/**
 * Main GitHub Action entry point
 */
async function run() {
  try {
    // Step 1: Get inputs
    const bobApiKey = core.getInput('bob_api_key', { required: true });
    const checks = core.getInput('checks') || 'security-scan,solid-check,bug-detector,perf-analyzer';
    const failOn = core.getInput('fail_on') || 'critical';

    core.info(`Running GitPulse checks: ${checks}`);
    core.info(`Fail on severity: ${failOn}`);

    // Step 2: Set BOB_API_KEY environment variable
    core.exportVariable('BOB_API_KEY', bobApiKey);

    // Step 3: Run gitpulse check command
    core.info('Running gitpulse check...');
    try {
      execSync(`npx gitpulse check --ci --only ${checks} --output json`, {
        stdio: 'inherit',
        env: {
          ...process.env,
          BOB_API_KEY: bobApiKey
        }
      });
    } catch (error) {
      // Command may exit with code 1 if critical findings, but we want to continue
      // to post the comment before failing
      core.warning('GitPulse check completed with findings');
    }

    // Step 4: Read summary.json
    const summaryPath = 'gitpulse-reports/summary.json';
    if (!existsSync(summaryPath)) {
      core.info('No summary report found. No issues detected.');
      return;
    }

    const summaryContent = readFileSync(summaryPath, 'utf8');
    let summary;
    try {
      summary = JSON.parse(summaryContent);
    } catch (error) {
      core.warning(`Failed to parse summary.json: ${error.message}`);
      return;
    }

    // Step 5: Format findings as GitHub-flavoured Markdown
    const markdown = formatFindings(summary);

    // Step 6: Post comment to PR
    const context = github.context;
    if (context.payload && context.payload.pull_request) {
      const octokit = github.getOctokit(process.env.GITHUB_TOKEN || core.getInput('github_token'));
      
      try {
        await octokit.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: context.payload.pull_request.number,
          body: markdown
        });

        core.info('Posted review comment to PR');
      } catch (error) {
        core.warning(`Failed to post PR comment: ${error.message}`);
      }
    } else {
      core.info('Not a pull request event, skipping comment');
      core.info('Review results:\n' + markdown);
    }

    // Step 7: Check for findings based on failOn severity threshold
    const shouldFail = checkSeverityThreshold(summary, failOn);
    
    if (shouldFail) {
      core.setFailed(`Issues found at '${failOn}' severity or above`);
    } else {
      core.info('✓ GitPulse review complete');
    }

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

/**
 * Format findings as GitHub-flavoured Markdown
 * @param {Object} summary - Summary object from gitpulse-reports/summary.json
 * @returns {string} Markdown formatted comment
 */
function formatFindings(summary) {
  let markdown = '## 🛡️ GitPulse Review\n\n';

  // Collect all findings from all checks
  const allFindings = [];
  const checkNames = Object.keys(summary);

  checkNames.forEach(checkName => {
    const checkData = summary[checkName];
    if (checkData.findings && Array.isArray(checkData.findings)) {
      checkData.findings.forEach(finding => {
        allFindings.push({
          ...finding,
          check: checkName
        });
      });
    }
  });

  if (allFindings.length === 0) {
    markdown += '✅ **No issues found!** Your code looks great.\n';
    return markdown;
  }

  // Group by severity
  const severityOrder = ['Critical', 'High', 'Medium', 'Low'];
  const grouped = {
    Critical: [],
    High: [],
    Medium: [],
    Low: []
  };

  allFindings.forEach(finding => {
    const severity = finding.severity || 'Low';
    if (grouped[severity]) {
      grouped[severity].push(finding);
    } else {
      grouped.Low.push(finding);
    }
  });

  // Count totals
  const counts = {
    Critical: grouped.Critical.length,
    High: grouped.High.length,
    Medium: grouped.Medium.length,
    Low: grouped.Low.length
  };

  // Add summary counts
  const summaryParts = [];
  if (counts.Critical > 0) summaryParts.push(`🔴 ${counts.Critical} Critical`);
  if (counts.High > 0) summaryParts.push(`🟠 ${counts.High} High`);
  if (counts.Medium > 0) summaryParts.push(`🟡 ${counts.Medium} Medium`);
  if (counts.Low > 0) summaryParts.push(`⚪ ${counts.Low} Low`);

  markdown += `**Found ${allFindings.length} issue(s):** ${summaryParts.join(' • ')}\n\n`;

  // Create table
  markdown += '| Severity | Check | Issue | Line | Fix |\n';
  markdown += '|----------|-------|-------|------|-----|\n';

  // Add findings grouped by severity
  severityOrder.forEach(severity => {
    if (grouped[severity].length === 0) return;

    grouped[severity].forEach(finding => {
      const severityEmoji = severity === 'Critical' ? '🔴' :
                           severity === 'High' ? '🟠' :
                           severity === 'Medium' ? '🟡' : '⚪';
      
      const issue = (finding.issue || finding.name || 'Unnamed issue').replace(/\|/g, '\\|');
      const check = (finding.check || 'unknown').replace(/\|/g, '\\|');
      const line = finding.line || '-';
      const fix = (finding.fix || finding.suggestion || 'See details').replace(/\|/g, '\\|').substring(0, 100);

      markdown += `| ${severityEmoji} ${severity} | ${check} | ${issue} | ${line} | ${fix} |\n`;
    });
  });

  // Footer
  markdown += '\n---\n';
  markdown += '*Powered by [GitPulse](https://github.com/your-org/gitpulse) with IBM Bob Shell*\n';

  return markdown;
}

/**
 * Check if there are findings at or above the specified severity threshold
 * @param {Object} summary - Summary object from gitpulse-reports/summary.json
 * @param {string} threshold - Severity threshold: 'critical', 'high', 'medium', or 'low'
 * @returns {boolean} True if findings at or above threshold exist
 */
function checkSeverityThreshold(summary, threshold) {
  const severityLevels = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };
  
  const thresholdLevel = severityLevels[threshold.toLowerCase()] || 4;
  const checkNames = Object.keys(summary);
  
  for (const checkName of checkNames) {
    const checkData = summary[checkName];
    if (checkData.findings && Array.isArray(checkData.findings)) {
      for (const finding of checkData.findings) {
        const findingSeverity = finding.severity ? finding.severity.toLowerCase() : 'low';
        const findingLevel = severityLevels[findingSeverity] || 1;
        
        if (findingLevel >= thresholdLevel) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Run the action
run();

// Made with Bob
