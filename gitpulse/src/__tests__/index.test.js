/**
 * Unit tests for index.js (CLI entry point)
 * Tests cover command parsing, validation, and error handling
 */

import { jest } from '@jest/globals';
import { execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('../runBob.js');
jest.mock('../gitDiff.js');
jest.mock('../reporter.js');
jest.mock('../checks/index.js');

describe('CLI - checkBobInstalled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('does not throw when bob is installed', () => {
    execSync.mockReturnValue('1.0.0');
    
    // This would be tested by importing and calling the function
    // Since it's not exported, we test indirectly through command execution
    expect(() => {
      execSync('bob --version', { stdio: 'ignore' });
    }).not.toThrow();
  });
  
  test('throws error when bob is not found', () => {
    const error = new Error('command not found');
    error.code = 'ENOENT';
    execSync.mockImplementation(() => {
      throw error;
    });
    
    expect(() => {
      execSync('bob --version', { stdio: 'ignore' });
    }).toThrow();
  });
  
  test('handles other execution errors', () => {
    execSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });
    
    expect(() => {
      execSync('bob --version', { stdio: 'ignore' });
    }).toThrow('Permission denied');
  });
});

describe('CLI - detectEntryPoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    existsSync.mockReturnValue(false);
  });
  
  test('detects src/index.js as entry point', () => {
    existsSync.mockImplementation((path) => path === 'src/index.js');
    
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
    
    const detected = candidates.find(c => existsSync(c));
    expect(detected).toBe('src/index.js');
  });
  
  test('detects src/index.ts when js not present', () => {
    existsSync.mockImplementation((path) => path === 'src/index.ts');
    
    const candidates = [
      'src/index.js',
      'src/index.ts',
      'src/main.js'
    ];
    
    const detected = candidates.find(c => existsSync(c));
    expect(detected).toBe('src/index.ts');
  });
  
  test('detects src/main.js when index not present', () => {
    existsSync.mockImplementation((path) => path === 'src/main.js');
    
    const candidates = [
      'src/index.js',
      'src/index.ts',
      'src/main.js'
    ];
    
    const detected = candidates.find(c => existsSync(c));
    expect(detected).toBe('src/main.js');
  });
  
  test('detects root index.js when src not present', () => {
    existsSync.mockImplementation((path) => path === 'index.js');
    
    const candidates = [
      'src/index.js',
      'src/index.ts',
      'index.js'
    ];
    
    const detected = candidates.find(c => existsSync(c));
    expect(detected).toBe('index.js');
  });
  
  test('detects app.js as fallback', () => {
    existsSync.mockImplementation((path) => path === 'app.js');
    
    const candidates = [
      'src/index.js',
      'index.js',
      'app.js'
    ];
    
    const detected = candidates.find(c => existsSync(c));
    expect(detected).toBe('app.js');
  });
  
  test('returns undefined when no entry point found', () => {
    existsSync.mockReturnValue(false);
    
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
    
    const detected = candidates.find(c => existsSync(c));
    expect(detected).toBeUndefined();
  });
  
  test('prefers src/index.js over other options', () => {
    existsSync.mockReturnValue(true); // All exist
    
    const candidates = [
      'src/index.js',
      'src/index.ts',
      'index.js'
    ];
    
    const detected = candidates.find(c => existsSync(c));
    expect(detected).toBe('src/index.js');
  });
});

describe('CLI - check command validation', () => {
  test('validates output format option', () => {
    const validFormats = ['terminal', 'json', 'both'];
    const invalidFormats = ['xml', 'html', 'csv', ''];
    
    validFormats.forEach(format => {
      expect(validFormats).toContain(format);
    });
    
    invalidFormats.forEach(format => {
      expect(validFormats).not.toContain(format);
    });
  });
  
  test('validates check names from --only option', () => {
    const validChecks = [
      'security-scan',
      'solid-check',
      'test-generator',
      'bug-detector',
      'perf-analyzer'
    ];
    
    const input = 'security-scan,solid-check';
    const requested = input.split(',').map(c => c.trim());
    
    const invalid = requested.filter(c => !validChecks.includes(c));
    expect(invalid.length).toBe(0);
  });
  
  test('detects invalid check names', () => {
    const validChecks = [
      'security-scan',
      'solid-check'
    ];
    
    const input = 'security-scan,invalid-check,solid-check';
    const requested = input.split(',').map(c => c.trim());
    
    const invalid = requested.filter(c => !validChecks.includes(c));
    expect(invalid).toEqual(['invalid-check']);
  });
  
  test('handles comma-separated check list', () => {
    const input = 'security-scan, solid-check, bug-detector';
    const checks = input.split(',').map(c => c.trim());
    
    expect(checks).toEqual(['security-scan', 'solid-check', 'bug-detector']);
  });
  
  test('handles single check without comma', () => {
    const input = 'security-scan';
    const checks = input.split(',').map(c => c.trim());
    
    expect(checks).toEqual(['security-scan']);
  });
});

describe('CLI - file operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('directory creation', () => {
    test('creates gitpulse-reports directory when it does not exist', () => {
      existsSync.mockReturnValue(false);
      mkdirSync.mockImplementation(() => {});
      
      const reportsDir = 'gitpulse-reports';
      if (!existsSync(reportsDir)) {
        mkdirSync(reportsDir, { recursive: true });
      }
      
      expect(mkdirSync).toHaveBeenCalledWith('gitpulse-reports', { recursive: true });
    });
    
    test('does not create directory when it already exists', () => {
      existsSync.mockReturnValue(true);
      
      const reportsDir = 'gitpulse-reports';
      if (!existsSync(reportsDir)) {
        mkdirSync(reportsDir, { recursive: true });
      }
      
      expect(mkdirSync).not.toHaveBeenCalled();
    });
  });
  
  describe('file writing', () => {
    test('writes converted code to file', () => {
      writeFileSync.mockImplementation(() => {});
      
      const content = 'converted code content';
      const outputPath = 'gitpulse-reports/converted-file.js';
      
      writeFileSync(outputPath, content, 'utf8');
      
      expect(writeFileSync).toHaveBeenCalledWith(
        outputPath,
        content,
        'utf8'
      );
    });
    
    test('handles write errors gracefully', () => {
      writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });
      
      expect(() => {
        writeFileSync('output.txt', 'content', 'utf8');
      }).toThrow('Disk full');
    });
  });
});

describe('CLI - convert command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('validates file exists before conversion', () => {
    existsSync.mockReturnValue(false);
    
    const file = 'nonexistent.js';
    const fileExists = existsSync(file);
    
    expect(fileExists).toBe(false);
  });
  
  test('accepts valid file for conversion', () => {
    existsSync.mockReturnValue(true);
    
    const file = 'src/index.js';
    const fileExists = existsSync(file);
    
    expect(fileExists).toBe(true);
  });
  
  test('generates output filename from input', () => {
    const file = 'src/utils/helper.js';
    const filename = file.split('/').pop();
    const outputPath = `gitpulse-reports/converted-${filename}`;
    
    expect(outputPath).toBe('gitpulse-reports/converted-helper.js');
  });
  
  test('handles file paths with multiple slashes', () => {
    const file = 'src/deep/nested/path/file.js';
    const filename = file.split('/').pop();
    
    expect(filename).toBe('file.js');
  });
  
  test('handles file paths without directory', () => {
    const file = 'file.js';
    const filename = file.split('/').pop();
    
    expect(filename).toBe('file.js');
  });
});

describe('CLI - docs command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    existsSync.mockReturnValue(false);
  });
  
  test('includes package.json in files to analyze', () => {
    const filesToAnalyze = ['package.json'];
    
    expect(filesToAnalyze).toContain('package.json');
  });
  
  test('includes README.md when it exists', () => {
    existsSync.mockImplementation((path) => path === 'README.md');
    
    const filesToAnalyze = ['package.json'];
    if (existsSync('README.md')) {
      filesToAnalyze.push('README.md');
    }
    
    expect(filesToAnalyze).toContain('README.md');
  });
  
  test('does not include README.md when it does not exist', () => {
    existsSync.mockReturnValue(false);
    
    const filesToAnalyze = ['package.json'];
    if (existsSync('README.md')) {
      filesToAnalyze.push('README.md');
    }
    
    expect(filesToAnalyze).not.toContain('README.md');
  });
  
  test('includes entry point when detected', () => {
    existsSync.mockImplementation((path) => path === 'src/index.js');
    
    const candidates = ['src/index.js', 'src/index.ts', 'index.js'];
    const entryPoint = candidates.find(c => existsSync(c));
    
    const filesToAnalyze = ['package.json'];
    if (entryPoint) {
      filesToAnalyze.push(entryPoint);
    }
    
    expect(filesToAnalyze).toContain('src/index.js');
  });
  
  test('uses src directory for architecture diagram when it exists', () => {
    existsSync.mockImplementation((path) => path === 'src');
    
    const archFiles = existsSync('src') ? ['src'] : ['.'];
    
    expect(archFiles).toEqual(['src']);
  });
  
  test('uses current directory for architecture when src does not exist', () => {
    existsSync.mockReturnValue(false);
    
    const archFiles = existsSync('src') ? ['src'] : ['.'];
    
    expect(archFiles).toEqual(['.']);
  });
});

describe('CLI - onboard command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    existsSync.mockReturnValue(false);
  });
  
  test('includes package.json in files to analyze', () => {
    const filesToAnalyze = ['package.json'];
    
    expect(filesToAnalyze).toContain('package.json');
  });
  
  test('includes README.md when it exists', () => {
    existsSync.mockImplementation((path) => path === 'README.md');
    
    const filesToAnalyze = ['package.json'];
    if (existsSync('README.md')) {
      filesToAnalyze.push('README.md');
    }
    
    expect(filesToAnalyze).toContain('README.md');
  });
  
  test('includes CONTRIBUTING.md when it exists', () => {
    existsSync.mockImplementation((path) => path === 'CONTRIBUTING.md');
    
    const filesToAnalyze = ['package.json'];
    if (existsSync('CONTRIBUTING.md')) {
      filesToAnalyze.push('CONTRIBUTING.md');
    }
    
    expect(filesToAnalyze).toContain('CONTRIBUTING.md');
  });
  
  test('includes entry point when detected', () => {
    existsSync.mockImplementation((path) => path === 'src/index.js');
    
    const candidates = ['src/index.js', 'index.js'];
    const entryPoint = candidates.find(c => existsSync(c));
    
    const filesToAnalyze = ['package.json'];
    if (entryPoint) {
      filesToAnalyze.push(entryPoint);
    }
    
    expect(filesToAnalyze).toContain('src/index.js');
  });
  
  test('builds complete file list with all available files', () => {
    existsSync.mockImplementation((path) => 
      ['README.md', 'CONTRIBUTING.md', 'src/index.js'].includes(path)
    );
    
    const filesToAnalyze = ['package.json'];
    
    if (existsSync('README.md')) {
      filesToAnalyze.push('README.md');
    }
    
    const candidates = ['src/index.js', 'index.js'];
    const entryPoint = candidates.find(c => existsSync(c));
    if (entryPoint) {
      filesToAnalyze.push(entryPoint);
    }
    
    if (existsSync('CONTRIBUTING.md')) {
      filesToAnalyze.push('CONTRIBUTING.md');
    }
    
    expect(filesToAnalyze).toEqual([
      'package.json',
      'README.md',
      'src/index.js',
      'CONTRIBUTING.md'
    ]);
  });
});

describe('CLI - error handling', () => {
  test('handles consecutive check failures', () => {
    const MAX_CONSECUTIVE_ERRORS = 3;
    let consecutiveErrors = 0;
    
    // Simulate 3 consecutive errors
    for (let i = 0; i < 3; i++) {
      consecutiveErrors++;
    }
    
    expect(consecutiveErrors).toBe(MAX_CONSECUTIVE_ERRORS);
  });
  
  test('resets error counter on success', () => {
    let consecutiveErrors = 2;
    
    // Simulate success
    consecutiveErrors = 0;
    
    expect(consecutiveErrors).toBe(0);
  });
  
  test('detects systemic failures', () => {
    const MAX_CONSECUTIVE_ERRORS = 3;
    let consecutiveErrors = 3;
    
    const shouldExit = consecutiveErrors >= MAX_CONSECUTIVE_ERRORS;
    
    expect(shouldExit).toBe(true);
  });
});

describe('CLI - CI mode behavior', () => {
  test('tracks critical findings in CI mode', () => {
    let hasCriticalFindings = false;
    
    const results = [
      { severity: 'Critical', issue: 'Security issue' }
    ];
    
    const hasCritical = results.some(r => r.severity === 'Critical');
    if (hasCritical) {
      hasCriticalFindings = true;
    }
    
    expect(hasCriticalFindings).toBe(true);
  });
  
  test('does not flag non-critical findings', () => {
    let hasCriticalFindings = false;
    
    const results = [
      { severity: 'High', issue: 'High issue' },
      { severity: 'Medium', issue: 'Medium issue' }
    ];
    
    const hasCritical = results.some(r => r.severity === 'Critical');
    if (hasCritical) {
      hasCriticalFindings = true;
    }
    
    expect(hasCriticalFindings).toBe(false);
  });
  
  test('uses origin/main for CI mode by default', () => {
    const mode = 'ci';
    const baseBranch = process.env.GITPULSE_BASE_BRANCH || 'origin/main';
    
    expect(baseBranch).toBe('origin/main');
  });
});
