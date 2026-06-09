/**
 * Analysis checks configuration
 * These are code quality checks that run on changed files during PR/commit reviews.
 * Documentation utilities (readme-writer, flowchart, etc.) are handled by separate commands.
 */

/**
 * Check if a file is a source file (not in node_modules, not a config/doc file)
 */
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
    '.lock'
  ];
  return !excluded.some(pattern => filePath.includes(pattern));
};

/**
 * Check if a file is a code file (supports multiple languages)
 */
const isCodeFile = (filePath) => {
  const extensions = [
    '.js', '.ts', '.jsx', '.tsx',  // JavaScript/TypeScript
    '.java',                        // Java
    '.py',                          // Python
    '.go',                          // Go
    '.rs',                          // Rust
    '.cpp', '.cc', '.cxx', '.c',    // C/C++
    '.rb',                          // Ruby
    '.php',                         // PHP
    '.cs',                          // C#
    '.swift',                       // Swift
    '.kt', '.kts'                   // Kotlin
  ];
  return extensions.some(ext => filePath.endsWith(ext));
};

/**
 * Check if a file is NOT a test file
 */
const isNotTestFile = (filePath) => {
  const testPatterns = ['.test.', '.spec.', '__tests__/', '__test__/'];
  return !testPatterns.some(pattern => filePath.includes(pattern));
};

/**
 * Always return true (check runs on all files or specific files passed)
 */
const alwaysRun = () => true;

/**
 * All available checks
 */
export const checks = {
  'security-scan': {
    skillName: 'security-scan',
    label: 'Security Scan',
    outputFormat: 'json',
    fileFilter: isSourceFile,
    description: 'Scans for security vulnerabilities and unsafe patterns'
  },
  
  'solid-check': {
    skillName: 'solid-check',
    label: 'SOLID Principles Check',
    outputFormat: 'json',
    fileFilter: (filePath) => isCodeFile(filePath) && isSourceFile(filePath),
    description: 'Analyzes code adherence to SOLID principles'
  },
  
  'bug-detector': {
    skillName: 'bug-detector',
    label: 'Bug Detector',
    outputFormat: 'json',
    fileFilter: isSourceFile,
    description: 'Detects potential bugs and code issues'
  },
  
  'perf-analyzer': {
    skillName: 'perf-analyzer',
    label: 'Performance Analyzer',
    outputFormat: 'json',
    fileFilter: isSourceFile,
    description: 'Analyzes code performance and suggests optimizations'
  },
  
  'test-generator': {
    skillName: 'test-generator',
    label: 'Test Generator',
    outputFormat: 'markdown',
    fileFilter: (filePath) => isSourceFile(filePath) && isNotTestFile(filePath),
    description: 'Generates unit tests for source files'
  }
};

/**
 * Default checks that run automatically on every commit/PR
 * These are code quality checks only - no documentation utilities
 */
export const defaultChecks = [
  'security-scan',
  'solid-check',
  'bug-detector',
  'perf-analyzer'
];

/**
 * Get a check configuration by name
 */
export const getCheck = (checkName) => {
  if (!isValidCheck(checkName)) {
    throw new Error(`Invalid check: ${checkName}`);
  }
  return checks[checkName];
};

/**
 * Get all check names
 */
export const getAllCheckNames = () => {
  return Object.keys(checks);
};

/**
 * Validate if a check name exists
 */
export const isValidCheck = (checkName) => {
  return checkName in checks;
};

// Made with Bob
// Test comment for gitpulse check
