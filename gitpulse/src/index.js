#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import runBob from './runBob.js';
import gitDiff from './gitDiff.js';
import { renderToTerminal, writeReport, writeMarkdownReport, hasCritical, writeDocsFile } from './reporter.js';
import { checks, defaultChecks, getCheck, isValidCheck } from './checks/index.js';

const program = new Command();

/**
 * Check if Bob Shell is installed and available on PATH
 * In CI mode with BOB_API_KEY, skip this check as we'll use API mode
 */
function checkBobInstalled() {
  // Skip check in CI if API key is available (will use API mode)
  if (process.env.CI && process.env.BOBSHELL_API_KEY) {
    console.log('ℹ️  Running in CI mode with API key - will use Bob API');
    return;
  }
  
  try {
    execSync('bob --version', { stdio: 'ignore' });
  } catch (error) {
    // If we have an API key, we can still proceed using API mode
    if (process.env.BOBSHELL_API_KEY) {
      console.log('ℹ️  Bob CLI not found, but API key available - will use Bob API');
      return;
    }
    
    // No CLI and no API key - cannot proceed
    if (error.code === 'ENOENT' || error.message.includes('command not found')) {
      console.error('\n❌ Bob Shell is not installed or not on PATH.');
      console.error('Install it from bob.ibm.com or set BOBSHELL_API_KEY environment variable.\n');
    } else {
      console.error('\n❌ Error checking Bob Shell installation:', error.message);
    }
    process.exit(1);
  }
}

/**
 * Detect the entry point of the project
 */
function detectEntryPoint() {
  const candidates = [
    'src/index.js',
    'src/index.ts',
    'src/main.js',
    'src/main.ts',
    'index.js',
    'index.ts',
    'app.js',
    'app.ts'
  ];
  
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  
  return null;
}

program
  .name('gitpulse')
  .description('AI-powered code analysis and documentation tool using Bob Shell')
  .version('1.0.0');

/**
 * gitpulse check [options]
 * Main analysis command
 */
program
  .command('check')
  .description('Run code analysis checks on changed files')
  .option('--only <checks>', 'Comma-separated list of check names to run (e.g., security-scan,solid-check)')
  .option('--ci', 'CI mode - use git diff origin/main...HEAD, exit with code 1 if Critical findings')
  .option('--output <format>', 'Output format: terminal (default), json, or both', 'terminal')
  .option('--native-skills', 'Use native Bob skill discovery instead of manual injection')
  .action(async (options) => {
    checkBobInstalled();
    
    // Validate --output option
    if (!['terminal', 'json', 'both'].includes(options.output)) {
      console.error(`❌ Invalid output format: ${options.output}. Must be one of: terminal, json, both`);
      process.exit(1);
    }
    
    // Step 1: Validate we're in a git repo
    let isRepo;
    try {
      isRepo = await gitDiff.isGitRepo();
    } catch (error) {
      console.error(`❌ Error checking git repository: ${error.message}`);
      process.exit(1);
    }
    
    if (!isRepo) {
      console.error('❌ Not a git repository. Please run this command from within a git repository.');
      process.exit(1);
    }
    
    // Step 2: Get changed files
    const mode = options.ci ? 'ci' : 'unstaged';
    let changedFiles;
    try {
      changedFiles = await gitDiff.getChangedFiles(mode);
    } catch (error) {
      console.error(`❌ Error getting changed files: ${error.message}`);
      process.exit(1);
    }
    
    // Step 3: If no changed files, exit early
    if (changedFiles.length === 0) {
      console.log('✓ No changed files to analyse');
      process.exit(0);
    }
    
    console.log(`Found ${changedFiles.length} changed file(s)\n`);
    
    // Step 4: Determine which checks to run
    let checksToRun = defaultChecks;
    if (options.only) {
      const requestedChecks = options.only.split(',').map(c => c.trim());
      
      // Validate all requested checks exist
      const invalidChecks = requestedChecks.filter(c => !isValidCheck(c));
      if (invalidChecks.length > 0) {
        console.error(`❌ Invalid check name(s): ${invalidChecks.join(', ')}`);
        console.error(`Available checks: ${Object.keys(checks).join(', ')}`);
        process.exit(1);
      }
      
      checksToRun = requestedChecks;
    }
    
    console.log(`Running checks: ${checksToRun.join(', ')}\n`);
    
    let hasCriticalFindings = false;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 3;
    
    // Step 5-8: Run each check
    for (const checkName of checksToRun) {
      const check = getCheck(checkName);
      
      // Add null check before accessing check.fileFilter
      if (!check) {
        console.error(`❌ Check '${checkName}' not found. Skipping.`);
        continue;
      }
      
      // Step 5: Filter files using check.fileFilter
      const filteredFiles = changedFiles.filter(check.fileFilter);
      
      // Skip if no matching files
      if (filteredFiles.length === 0) {
        console.log(`⊘ Skipping ${check.label} - no matching files\n`);
        continue;
      }
      
      console.log(`Running ${check.label} on ${filteredFiles.length} file(s)...`);
      
      // Step 6: Run Bob skill (now async)
      let results;
      try {
        results = await runBob(check.skillName, filteredFiles, {
          outputFormat: check.outputFormat,
          yolo: true,  // Auto-approve to get clean output without interactive prompts
          useNativeSkills: options.nativeSkills || false
        });
        
        // Ensure results is an array for JSON output
        if (check.outputFormat === 'json' && !Array.isArray(results)) {
          results = [];
        }
        
        // Reset error counter on success
        consecutiveErrors = 0;
      } catch (error) {
        console.error(`❌ Error running ${check.label}: ${error.message}`);
        consecutiveErrors++;
        
        // Detect systemic failures and exit early
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(`\n❌ ${MAX_CONSECUTIVE_ERRORS} consecutive check failures detected. This may indicate a systemic issue (e.g., Bob Shell not responding, API key invalid).`);
          console.error('Exiting early to avoid repeating the same error.\n');
          process.exit(1);
        }
        
        continue;
      }
      
      // Step 7: Render and write reports
      if (options.output === 'terminal' || options.output === 'both') {
        if (check.outputFormat === 'json') {
          renderToTerminal(check.label, results);
        } else {
          // For markdown output, just print it
          console.log(results);
        }
      }
      
      if (options.output === 'json' || options.output === 'both') {
        if (check.outputFormat === 'json') {
          writeReport(check.skillName, results);
        } else {
          // For markdown output, write to .md file
          writeMarkdownReport(check.skillName, results);
        }
      }
      
      // Step 8: Check for Critical findings in CI mode
      if (options.ci && check.outputFormat === 'json') {
        if (hasCritical(results)) {
          hasCriticalFindings = true;
        }
      }
    }
    
    // Exit with code 1 if Critical findings in CI mode
    if (options.ci && hasCriticalFindings) {
      console.error('\n❌ Critical findings detected. Exiting with code 1.');
      process.exit(1);
    }
    
    console.log('\n✓ All checks complete');
  });

/**
 * gitpulse docs
 * Generate documentation
 */
program
  .command('docs')
  .description('Generate project documentation (README, flowcharts, architecture)')
  .action(async () => {
    checkBobInstalled();
    
    console.log('Generating project documentation...\n');
    
    const entryPoint = detectEntryPoint();
    const filesToAnalyze = ['package.json'];
    
    if (existsSync('README.md')) {
      filesToAnalyze.push('README.md');
    }
    
    if (entryPoint) {
      filesToAnalyze.push(entryPoint);
    }
    
    // Run readme-writer
    try {
      console.log('Generating README...');
      const readmeResult = runBob('readme-writer', filesToAnalyze, {
        outputFormat: 'markdown'
      });
      console.log(readmeResult);
      writeDocsFile('README.md', readmeResult);
      console.log('');
    } catch (error) {
      console.error(`❌ Error generating README: ${error.message}\n`);
    }
    
    // Run flowchart
    try {
      console.log('Generating flowchart...');
      const flowchartResult = runBob('flowchart', filesToAnalyze, {
        outputFormat: 'markdown'
      });
      console.log(flowchartResult);
      writeDocsFile('flowchart.md', flowchartResult);
      console.log('');
    } catch (error) {
      console.error(`❌ Error generating flowchart: ${error.message}\n`);
    }
    
    // Run architecture-diagram (pass src/ folder)
    try {
      console.log('Generating architecture diagram...');
      const archFiles = existsSync('src') ? ['src'] : ['.'];
      const archResult = runBob('architecture-diagram', archFiles, {
        outputFormat: 'markdown'
      });
      console.log(archResult);
      writeDocsFile('architecture.md', archResult);
      console.log('');
    } catch (error) {
      console.error(`❌ Error generating architecture diagram: ${error.message}\n`);
    }
    
    console.log('✓ Documentation generation complete');
  });

/**
 * gitpulse onboard
 * Generate onboarding guide
 */
program
  .command('onboard')
  .description('Generate developer onboarding guide')
  .action(async () => {
    checkBobInstalled();
    
    console.log('Generating onboarding guide...\n');
    
    const entryPoint = detectEntryPoint();
    const filesToAnalyze = ['package.json'];
    
    if (existsSync('README.md')) {
      filesToAnalyze.push('README.md');
    }
    
    if (entryPoint) {
      filesToAnalyze.push(entryPoint);
    }
    
    if (existsSync('CONTRIBUTING.md')) {
      filesToAnalyze.push('CONTRIBUTING.md');
    }
    
    try {
      const result = runBob('onboarding-guide', filesToAnalyze, {
        outputFormat: 'markdown'
      });
      console.log(result);
      writeDocsFile('ONBOARDING.md', result);
      console.log('\n✓ Onboarding guide generated');
    } catch (error) {
      console.error(`❌ Error generating onboarding guide: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * gitpulse convert <file> --to <language>
 * Convert code to another language
 */
program
  .command('convert <file>')
  .description('Convert code file to another language')
  .requiredOption('--to <language>', 'Target language (e.g., python, java, typescript)')
  .action(async (file, options) => {
    checkBobInstalled();
    
    // Validate file exists
    if (!existsSync(file)) {
      console.error(`❌ File not found: ${file}`);
      process.exit(1);
    }
    
    console.log(`Converting ${file} to ${options.to}...\n`);
    
    try {
      // Run code-converter with markdown output (it's a code file, not JSON)
      const result = runBob('code-converter', [file], { 
        outputFormat: 'markdown' 
      });
      
      // Print to terminal
      console.log(result);
      
      // Save to gitpulse-reports/
      const reportsDir = 'gitpulse-reports';
      if (!existsSync(reportsDir)) {
        mkdirSync(reportsDir, { recursive: true });
      }
      
      const filename = file.split('/').pop();
      const outputPath = join(reportsDir, `converted-${filename}`);
      
      try {
        writeFileSync(outputPath, result, 'utf8');
        console.log(`\n✓ Converted code saved to ${outputPath}`);
      } catch (error) {
        console.error(`❌ Error writing converted file: ${error.message}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error converting code: ${error.message}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Made with Bob