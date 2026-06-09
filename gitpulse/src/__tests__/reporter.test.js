/**
 * Unit tests for reporter.js
 * Tests cover terminal rendering, file writing, and critical finding detection
 */

import { jest } from '@jest/globals';
import chalk from 'chalk';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';

// Mock dependencies
jest.mock('fs');
jest.mock('chalk', () => ({
  default: {
    bold: { underline: jest.fn(str => str) },
    green: jest.fn(str => str),
    red: { bold: jest.fn(str => str) },
    yellow: { bold: jest.fn(str => str), __esModule: true },
    gray: { bold: jest.fn(str => str) },
    bgRed: { white: { bold: jest.fn(str => str) } },
    dim: jest.fn(str => str)
  }
}));

// Import after mocking
const reporterModule = await import('../reporter.js');
const { renderToTerminal, writeReport, writeMarkdownReport, hasCritical } = reporterModule;

describe('renderToTerminal', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  
  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });
  
  describe('empty or invalid results', () => {
    test('displays success message when results array is empty', () => {
      renderToTerminal('test-skill', []);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No issues found by test-skill')
      );
    });
    
    test('displays success message when results is null', () => {
      renderToTerminal('test-skill', null);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No issues found by test-skill')
      );
    });
    
    test('displays success message when results is undefined', () => {
      renderToTerminal('test-skill', undefined);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No issues found by test-skill')
      );
    });
    
    test('displays success message when results is not an array', () => {
      renderToTerminal('test-skill', 'not an array');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No issues found by test-skill')
      );
    });
  });
  
  describe('severity grouping', () => {
    test('groups findings by severity', () => {
      const results = [
        { severity: 'Critical', issue: 'Critical issue' },
        { severity: 'High', issue: 'High issue' },
        { severity: 'Medium', issue: 'Medium issue' },
        { severity: 'Low', issue: 'Low issue' }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('HIGH')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('MEDIUM')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('LOW')
      );
    });
    
    test('handles findings with unknown severity', () => {
      const results = [
        { severity: 'Unknown', issue: 'Unknown severity issue' }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown severity 'Unknown'")
      );
    });
    
    test('treats findings without severity as Low', () => {
      const results = [
        { issue: 'No severity specified' }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('LOW')
      );
    });
    
    test('skips severity groups with no findings', () => {
      const results = [
        { severity: 'Critical', issue: 'Only critical' }
      ];
      
      renderToTerminal('test-skill', results);
      
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(allCalls).not.toContain('HIGH');
      expect(allCalls).not.toContain('MEDIUM');
    });
  });
  
  describe('finding display', () => {
    test('displays issue name', () => {
      const results = [
        { severity: 'High', issue: 'SQL Injection Vulnerability' }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('SQL Injection Vulnerability')
      );
    });
    
    test('displays line number when present', () => {
      const results = [
        { severity: 'High', issue: 'Bug found', line: 42 }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('(line 42)')
      );
    });
    
    test('does not display line info when line is missing', () => {
      const results = [
        { severity: 'High', issue: 'Bug found' }
      ];
      
      renderToTerminal('test-skill', results);
      
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(allCalls).not.toContain('(line');
    });
    
    test('displays evidence when present', () => {
      const results = [
        {
          severity: 'High',
          issue: 'Bug',
          evidence: 'const x = null;\nx.toString();'
        }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Evidence:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('const x = null;')
      );
    });
    
    test('displays multiline evidence correctly', () => {
      const results = [
        {
          severity: 'High',
          issue: 'Bug',
          evidence: 'line 1\nline 2\nline 3'
        }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('line 1')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('line 2')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('line 3')
      );
    });
    
    test('displays fix suggestion when present', () => {
      const results = [
        {
          severity: 'High',
          issue: 'Bug',
          fix: 'Add null check before accessing property'
        }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fix:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Add null check')
      );
    });
    
    test('displays suggestion field as fix when fix is missing', () => {
      const results = [
        {
          severity: 'High',
          issue: 'Bug',
          suggestion: 'Use try-catch block'
        }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fix:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Use try-catch block')
      );
    });
    
    test('uses name field when issue field is missing', () => {
      const results = [
        { severity: 'High', name: 'Named Issue' }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Named Issue')
      );
    });
    
    test('displays "Unnamed issue" when both issue and name are missing', () => {
      const results = [
        { severity: 'High' }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unnamed issue')
      );
    });
  });
  
  describe('summary display', () => {
    test('displays summary with all severity counts', () => {
      const results = [
        { severity: 'Critical', issue: 'C1' },
        { severity: 'Critical', issue: 'C2' },
        { severity: 'High', issue: 'H1' },
        { severity: 'Medium', issue: 'M1' },
        { severity: 'Low', issue: 'L1' }
      ];
      
      renderToTerminal('test-skill', results);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Summary:')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('2 critical')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 high')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 medium')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 low')
      );
    });
    
    test('omits zero counts from summary', () => {
      const results = [
        { severity: 'Critical', issue: 'C1' }
      ];
      
      renderToTerminal('test-skill', results);
      
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(allCalls).toContain('1 critical');
      expect(allCalls).not.toContain('0 high');
      expect(allCalls).not.toContain('0 medium');
    });
  });
});

describe('writeReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    existsSync.mockReturnValue(false);
  });
  
  describe('directory creation', () => {
    test('creates gitpulse-reports directory if it does not exist', () => {
      existsSync.mockReturnValue(false);
      writeFileSync.mockImplementation(() => {});
      
      writeReport('test-skill', []);
      
      expect(mkdirSync).toHaveBeenCalledWith('gitpulse-reports', { recursive: true });
    });
    
    test('does not create directory if it already exists', () => {
      existsSync.mockReturnValue(true);
      writeFileSync.mockImplementation(() => {});
      readFileSync.mockReturnValue('{}');
      
      writeReport('test-skill', []);
      
      expect(mkdirSync).toHaveBeenCalledWith('gitpulse-reports', { recursive: true });
    });
  });
  
  describe('skill-specific report', () => {
    test('writes skill report to correct path', () => {
      writeFileSync.mockImplementation(() => {});
      
      const results = [{ severity: 'High', issue: 'Test' }];
      writeReport('security-scan', results);
      
      expect(writeFileSync).toHaveBeenCalledWith(
        'gitpulse-reports/security-scan.json',
        expect.any(String),
        'utf8'
      );
    });
    
    test('writes results as formatted JSON', () => {
      writeFileSync.mockImplementation(() => {});
      
      const results = [{ severity: 'High', issue: 'Test' }];
      writeReport('test-skill', results);
      
      const writtenContent = writeFileSync.mock.calls[0][1];
      expect(writtenContent).toBe(JSON.stringify(results, null, 2));
    });
    
    test('handles empty results array', () => {
      writeFileSync.mockImplementation(() => {});
      
      writeReport('test-skill', []);
      
      const writtenContent = writeFileSync.mock.calls[0][1];
      expect(writtenContent).toBe('[]');
    });
  });
  
  describe('summary report', () => {
    test('creates new summary when file does not exist', () => {
      existsSync.mockImplementation((path) => {
        return path !== 'gitpulse-reports/summary.json';
      });
      writeFileSync.mockImplementation(() => {});
      
      const results = [{ severity: 'High', issue: 'Test' }];
      writeReport('test-skill', results);
      
      const summaryCall = writeFileSync.mock.calls.find(
        call => call[0] === 'gitpulse-reports/summary.json'
      );
      
      expect(summaryCall).toBeDefined();
      const summary = JSON.parse(summaryCall[1]);
      expect(summary['test-skill']).toBeDefined();
      expect(summary['test-skill'].findings).toEqual(results);
      expect(summary['test-skill'].count).toBe(1);
    });
    
    test('updates existing summary with new skill results', () => {
      const existingSummary = {
        'old-skill': {
          timestamp: '2024-01-01T00:00:00.000Z',
          findings: [],
          count: 0
        }
      };
      
      existsSync.mockImplementation((path) => {
        return path === 'gitpulse-reports/summary.json';
      });
      readFileSync.mockReturnValue(JSON.stringify(existingSummary));
      writeFileSync.mockImplementation(() => {});
      
      const results = [{ severity: 'High', issue: 'New' }];
      writeReport('new-skill', results);
      
      const summaryCall = writeFileSync.mock.calls.find(
        call => call[0] === 'gitpulse-reports/summary.json'
      );
      
      const summary = JSON.parse(summaryCall[1]);
      expect(summary['old-skill']).toBeDefined();
      expect(summary['new-skill']).toBeDefined();
      expect(summary['new-skill'].findings).toEqual(results);
    });
    
    test('overwrites existing skill results in summary', () => {
      const existingSummary = {
        'test-skill': {
          timestamp: '2024-01-01T00:00:00.000Z',
          findings: [{ old: 'data' }],
          count: 1
        }
      };
      
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(existingSummary));
      writeFileSync.mockImplementation(() => {});
      
      const newResults = [{ severity: 'High', issue: 'New' }];
      writeReport('test-skill', newResults);
      
      const summaryCall = writeFileSync.mock.calls.find(
        call => call[0] === 'gitpulse-reports/summary.json'
      );
      
      const summary = JSON.parse(summaryCall[1]);
      expect(summary['test-skill'].findings).toEqual(newResults);
      expect(summary['test-skill'].count).toBe(1);
    });
    
    test('handles corrupted summary file gracefully', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue('invalid json{');
      writeFileSync.mockImplementation(() => {});
      
      const results = [{ severity: 'High', issue: 'Test' }];
      
      expect(() => {
        writeReport('test-skill', results);
      }).not.toThrow();
      
      const summaryCall = writeFileSync.mock.calls.find(
        call => call[0] === 'gitpulse-reports/summary.json'
      );
      
      const summary = JSON.parse(summaryCall[1]);
      expect(summary['test-skill']).toBeDefined();
    });
    
    test('includes timestamp in summary entry', () => {
      writeFileSync.mockImplementation(() => {});
      
      writeReport('test-skill', []);
      
      const summaryCall = writeFileSync.mock.calls.find(
        call => call[0] === 'gitpulse-reports/summary.json'
      );
      
      const summary = JSON.parse(summaryCall[1]);
      expect(summary['test-skill'].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
  
  describe('error handling', () => {
    test('throws error when writeFileSync fails', () => {
      writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });
      
      expect(() => {
        writeReport('test-skill', []);
      }).toThrow('Disk full');
    });
    
    test('throws error when mkdirSync fails', () => {
      mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      expect(() => {
        writeReport('test-skill', []);
      }).toThrow('Permission denied');
    });
  });
});

describe('writeMarkdownReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    existsSync.mockReturnValue(false);
  });
  
  test('creates gitpulse-reports directory if it does not exist', () => {
    writeFileSync.mockImplementation(() => {});
    
    writeMarkdownReport('test-skill', '# Report');
    
    expect(mkdirSync).toHaveBeenCalledWith('gitpulse-reports', { recursive: true });
  });
  
  test('writes markdown to correct path', () => {
    writeFileSync.mockImplementation(() => {});
    
    writeMarkdownReport('test-generator', '# Test Report');
    
    expect(writeFileSync).toHaveBeenCalledWith(
      'gitpulse-reports/test-generator.md',
      '# Test Report',
      'utf8'
    );
  });
  
  test('preserves markdown formatting', () => {
    writeFileSync.mockImplementation(() => {});
    
    const markdown = '# Header\n\n- Item 1\n- Item 2\n\n```js\ncode\n```';
    writeMarkdownReport('test-skill', markdown);
    
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      markdown,
      'utf8'
    );
  });
  
  test('handles empty markdown content', () => {
    writeFileSync.mockImplementation(() => {});
    
    writeMarkdownReport('test-skill', '');
    
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      '',
      'utf8'
    );
  });
  
  test('throws error when writeFileSync fails', () => {
    writeFileSync.mockImplementation(() => {
      throw new Error('Write failed');
    });
    
    expect(() => {
      writeMarkdownReport('test-skill', '# Report');
    }).toThrow('Write failed');
  });
});

describe('hasCritical', () => {
  test('returns true when results contain Critical severity', () => {
    const results = [
      { severity: 'High', issue: 'High issue' },
      { severity: 'Critical', issue: 'Critical issue' }
    ];
    
    expect(hasCritical(results)).toBe(true);
  });
  
  test('returns false when results contain no Critical severity', () => {
    const results = [
      { severity: 'High', issue: 'High issue' },
      { severity: 'Medium', issue: 'Medium issue' }
    ];
    
    expect(hasCritical(results)).toBe(false);
  });
  
  test('returns false for empty results array', () => {
    expect(hasCritical([])).toBe(false);
  });
  
  test('returns false when results is null', () => {
    expect(hasCritical(null)).toBe(false);
  });
  
  test('returns false when results is undefined', () => {
    expect(hasCritical(undefined)).toBe(false);
  });
  
  test('returns false when results is not an array', () => {
    expect(hasCritical('not an array')).toBe(false);
    expect(hasCritical({ severity: 'Critical' })).toBe(false);
  });
  
  test('returns true when multiple Critical findings exist', () => {
    const results = [
      { severity: 'Critical', issue: 'C1' },
      { severity: 'Critical', issue: 'C2' },
      { severity: 'High', issue: 'H1' }
    ];
    
    expect(hasCritical(results)).toBe(true);
  });
  
  test('is case-sensitive for severity check', () => {
    const results = [
      { severity: 'critical', issue: 'lowercase' },
      { severity: 'CRITICAL', issue: 'uppercase' }
    ];
    
    expect(hasCritical(results)).toBe(false);
  });
  
  test('returns true for single Critical finding', () => {
    const results = [
      { severity: 'Critical', issue: 'Only critical' }
    ];
    
    expect(hasCritical(results)).toBe(true);
  });
});