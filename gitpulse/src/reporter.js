import chalk from 'chalk';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Renders analysis results to the terminal with color-coded output.
 * 
 * @param {string} skillName - Name of the skill that produced the results
 * @param {Array} results - Array of finding objects from runBob
 * 
 * @example
 * renderToTerminal('security-scan', [
 *   { severity: 'Critical', issue: 'SQL Injection', line: 42, evidence: '...', fix: '...' }
 * ]);
 */
export function renderToTerminal(skillName, results) {
  console.log('\n' + chalk.bold.underline(`Results from ${skillName}:`));
  
  // Add explicit array check
  if (!results || !Array.isArray(results) || results.length === 0) {
    console.log(chalk.green('✓') + ` No issues found by ${skillName}\n`);
    return;
  }
  
  // Group findings by severity
  const severityOrder = ['Critical', 'High', 'Medium', 'Low'];
  const grouped = {
    Critical: [],
    High: [],
    Medium: [],
    Low: []
  };
  
  results.forEach(finding => {
    const severity = finding.severity || 'Low';
    if (grouped[severity]) {
      grouped[severity].push(finding);
    } else {
      // Log warning when unknown severity is encountered
      console.warn(chalk.yellow(`⚠ Warning: Unknown severity '${severity}' for finding. Treating as Low.`));
      grouped.Low.push(finding);
    }
  });
  
  // Count for summary
  const counts = {
    Critical: grouped.Critical.length,
    High: grouped.High.length,
    Medium: grouped.Medium.length,
    Low: grouped.Low.length
  };
  
  // Render each severity group
  severityOrder.forEach(severity => {
    if (grouped[severity].length === 0) return;
    
    // Render header based on severity
    console.log('\n');
    switch (severity) {
      case 'Critical':
        console.log(chalk.bgRed.white.bold(` ${severity.toUpperCase()} `));
        break;
      case 'High':
        console.log(chalk.red.bold(`${severity.toUpperCase()}`));
        break;
      case 'Medium':
        console.log(chalk.yellow.bold(`${severity.toUpperCase()}`));
        break;
      case 'Low':
        console.log(chalk.gray.bold(`${severity.toUpperCase()}`));
        break;
    }
    
    // Render each finding in this severity group
    grouped[severity].forEach((finding, index) => {
      const badge = severity === 'Critical' ? chalk.bgRed.white(' ! ') :
                    severity === 'High' ? chalk.red('⚠') :
                    severity === 'Medium' ? chalk.yellow('⚠') :
                    chalk.gray('ℹ');
      
      const issueName = finding.issue || finding.name || 'Unnamed issue';
      const lineInfo = finding.line ? ` (line ${finding.line})` : '';
      
      console.log(`\n${badge} ${chalk.bold(issueName)}${lineInfo}`);
      
      // Evidence (code snippet)
      if (finding.evidence) {
        console.log(chalk.dim('  Evidence:'));
        const evidenceLines = finding.evidence.split('\n');
        evidenceLines.forEach(line => {
          console.log(chalk.dim(`    ${line}`));
        });
      }
      
      // Fix suggestion
      if (finding.fix || finding.suggestion) {
        const fixText = finding.fix || finding.suggestion;
        console.log(chalk.green('  Fix: ') + fixText);
      }
    });
  });
  
  // Print summary
  console.log('\n' + chalk.bold('Summary:'));
  const summaryParts = [];
  if (counts.Critical > 0) summaryParts.push(chalk.red(`${counts.Critical} critical`));
  if (counts.High > 0) summaryParts.push(chalk.red(`${counts.High} high`));
  if (counts.Medium > 0) summaryParts.push(chalk.yellow(`${counts.Medium} medium`));
  if (counts.Low > 0) summaryParts.push(chalk.gray(`${counts.Low} low`));
  
  console.log(summaryParts.join(', ') + ' findings\n');
}

/**
 * Writes analysis results to report files.
 * Creates gitpulse-reports/ directory and writes both skill-specific and summary reports.
 * 
 * @param {string} skillName - Name of the skill that produced the results
 * @param {Array} results - Array of finding objects from runBob
 * 
 * @example
 * writeReport('security-scan', findings);
 */
export function writeReport(skillName, results) {
  const reportsDir = 'gitpulse-reports';
  
  // Create reports directory if it doesn't exist
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  
  try {
    // Write skill-specific report
    const skillReportPath = join(reportsDir, `${skillName}.json`);
    writeFileSync(skillReportPath, JSON.stringify(results, null, 2), 'utf8');
    
    // Update summary report (accumulate all results)
    const summaryPath = join(reportsDir, 'summary.json');
    let summary = {};
    
    // Read existing summary if it exists
    if (existsSync(summaryPath)) {
      try {
        const existingContent = readFileSync(summaryPath, 'utf8');
        summary = JSON.parse(existingContent);
      } catch (error) {
        // If parse fails, start fresh
        summary = {};
      }
    }
    
    // Add or update this skill's results in the summary
    summary[skillName] = {
      timestamp: new Date().toISOString(),
      findings: results,
      count: results.length
    };
    
    // Write updated summary
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    
    console.log(chalk.dim(`Reports written to ${reportsDir}/`));
  } catch (error) {
    console.error(chalk.red(`Error writing report files: ${error.message}`));
    throw error;
  }
}

/**
 * Writes markdown results to a file in the gitpulse-reports directory.
 *
 * @param {string} skillName - Name of the skill that produced the results
 * @param {string} markdownContent - Markdown content to write
 *
 * @example
 * writeMarkdownReport('test-generator', markdownContent);
 */
export function writeMarkdownReport(skillName, markdownContent) {
  const reportsDir = 'gitpulse-reports';
  
  // Create reports directory if it doesn't exist
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  
  try {
    // Write markdown report
    const reportPath = join(reportsDir, `${skillName}.md`);
    writeFileSync(reportPath, markdownContent, 'utf8');
    
    console.log(chalk.dim(`Markdown report written to ${reportPath}`));
  } catch (error) {
    console.error(chalk.red(`Error writing markdown report: ${error.message}`));
    throw error;
  }
}

/**
 * Writes documentation files to the docs/ directory.
 *
 * @param {string} filename - Name of the file to write (e.g., 'README.md', 'architecture.md')
 * @param {string} content - Markdown content to write
 *
 * @example
 * writeDocsFile('architecture.md', markdownContent);
 */
export function writeDocsFile(filename, content) {
  const docsDir = 'docs';
  
  // Create docs directory if it doesn't exist
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }
  
  try {
    // Write documentation file
    const filePath = join(docsDir, filename);
    writeFileSync(filePath, content, 'utf8');
    
    console.log(chalk.dim(`📄 Saved to ${filePath}`));
  } catch (error) {
    console.error(chalk.red(`Error writing documentation file: ${error.message}`));
    throw error;
  }
}

/**
 * Checks if any finding in the results has Critical severity.
 * 
 * @param {Array} results - Array of finding objects
 * @returns {boolean} True if any finding has severity === "Critical"
 * 
 * @example
 * if (hasCritical(results)) {
 *   console.error('Critical issues found!');
 *   process.exit(1);
 * }
 */
export function hasCritical(results) {
  if (!results || !Array.isArray(results)) {
    return false;
  }
  
  return results.some(finding => finding.severity === 'Critical');
}

// Made with Bob
