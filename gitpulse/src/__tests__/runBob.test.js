/**
 * Unit tests for runBob.js
 * Tests cover happy paths, edge cases, error paths, and validation
 */

import { jest } from '@jest/globals';
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs');

// Import after mocking
const runBobModule = await import('../runBob.js');
const runBob = runBobModule.default;

describe('runBob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('parameter validation', () => {
    test('throws error for invalid skill name with uppercase letters', () => {
      expect(() => {
        runBob('Invalid-Skill', ['file.js']);
      }).toThrow("Invalid skill name 'Invalid-Skill'. Skill names must contain only lowercase letters, numbers, and hyphens.");
    });
    
    test('throws error for skill name with special characters', () => {
      expect(() => {
        runBob('skill@name', ['file.js']);
      }).toThrow("Invalid skill name 'skill@name'");
    });
    
    test('throws error for skill name with spaces', () => {
      expect(() => {
        runBob('skill name', ['file.js']);
      }).toThrow("Invalid skill name 'skill name'");
    });
    
    test('throws error for skill name with path traversal attempt', () => {
      expect(() => {
        runBob('../../../etc/passwd', ['file.js']);
      }).toThrow("Invalid skill name '../../../etc/passwd'");
    });
    
    test('accepts valid skill name with hyphens and numbers', () => {
      readFileSync.mockReturnValue('skill content');
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '{}',
        stderr: ''
      });
      
      expect(() => {
        runBob('test-skill-123', ['file.js'], { outputFormat: 'json' });
      }).not.toThrow();
    });
    
    test('throws error when files parameter is not an array', () => {
      expect(() => {
        runBob('test-skill', 'file.js');
      }).toThrow('files must be an array');
    });
    
    test('throws error when files parameter is null', () => {
      expect(() => {
        runBob('test-skill', null);
      }).toThrow('files must be an array');
    });
    
    test('throws error when files parameter is undefined', () => {
      expect(() => {
        runBob('test-skill', undefined);
      }).toThrow('files must be an array');
    });
    
    test('accepts empty files array', () => {
      readFileSync.mockReturnValue('skill content');
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '{}',
        stderr: ''
      });
      
      expect(() => {
        runBob('test-skill', [], { outputFormat: 'json' });
      }).not.toThrow();
    });
  });
  
  describe('skill file reading', () => {
    test('reads SKILL.md from correct path', () => {
      readFileSync.mockReturnValue('skill content');
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '{}',
        stderr: ''
      });
      
      runBob('security-scan', ['file.js'], { outputFormat: 'json' });
      
      expect(readFileSync).toHaveBeenCalledWith(
        '.bob/skills/security-scan/SKILL.md',
        'utf8'
      );
    });
    
    test('throws error when skill not found', () => {
      readFileSync.mockImplementation(() => {
        const error = new Error('ENOENT');
        error.code = 'ENOENT';
        throw error;
      });
      
      expect(() => {
        runBob('nonexistent-skill', ['file.js']);
      }).toThrow("Skill 'nonexistent-skill' not found at .bob/skills/nonexistent-skill/SKILL.md");
    });
    
    test('throws error when file read fails for other reasons', () => {
      readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      expect(() => {
        runBob('test-skill', ['file.js']);
      }).toThrow('Permission denied');
    });
  });
  
  describe('prompt building', () => {
    test('appends JSON instruction when outputFormat is json', () => {
      const skillContent = 'Analyze the code';
      readFileSync.mockReturnValue(skillContent);
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '{}',
        stderr: ''
      });
      
      runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      expect(spawnSync).toHaveBeenCalledWith(
        'bob',
        expect.any(Array),
        expect.objectContaining({
          input: 'Analyze the code\n\nOutput only valid JSON.'
        })
      );
    });
    
    test('appends Markdown instruction when outputFormat is markdown', () => {
      const skillContent = 'Generate report';
      readFileSync.mockReturnValue(skillContent);
      spawnSync.mockReturnValue({
        status: 0,
        stdout: 'markdown output',
        stderr: ''
      });
      
      runBob('test-skill', ['file.js'], { outputFormat: 'markdown' });
      
      expect(spawnSync).toHaveBeenCalledWith(
        'bob',
        expect.any(Array),
        expect.objectContaining({
          input: 'Generate report\n\nOutput only Markdown.'
        })
      );
    });
    
    test('does not append format instruction when outputFormat not specified', () => {
      const skillContent = 'Do something';
      readFileSync.mockReturnValue(skillContent);
      spawnSync.mockReturnValue({
        status: 0,
        stdout: 'output',
        stderr: ''
      });
      
      runBob('test-skill', ['file.js']);
      
      expect(spawnSync).toHaveBeenCalledWith(
        'bob',
        expect.any(Array),
        expect.objectContaining({
          input: 'Do something'
        })
      );
    });
  });
  
  describe('command arguments building', () => {
    beforeEach(() => {
      readFileSync.mockReturnValue('skill content');
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '{}',
        stderr: ''
      });
    });
    
    test('includes --yolo flag when yolo option is true', () => {
      runBob('test-skill', ['file.js'], { yolo: true, outputFormat: 'json' });
      
      const args = spawnSync.mock.calls[0][1];
      expect(args).toContain('--yolo');
    });
    
    test('does not include --yolo flag when yolo option is false', () => {
      runBob('test-skill', ['file.js'], { yolo: false, outputFormat: 'json' });
      
      const args = spawnSync.mock.calls[0][1];
      expect(args).not.toContain('--yolo');
    });
    
    test('always includes --hide-intermediary-output flag', () => {
      runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      const args = spawnSync.mock.calls[0][1];
      expect(args).toContain('--hide-intermediary-output');
    });
    
    test('includes --chat-mode flag when mode option is provided', () => {
      runBob('test-skill', ['file.js'], { mode: 'custom-mode', outputFormat: 'json' });
      
      const args = spawnSync.mock.calls[0][1];
      expect(args).toContain('--chat-mode');
      expect(args).toContain('custom-mode');
    });
    
    test('adds @ prefix to each file path', () => {
      runBob('test-skill', ['src/file1.js', 'src/file2.js'], { outputFormat: 'json' });
      
      const args = spawnSync.mock.calls[0][1];
      expect(args).toContain('@src/file1.js');
      expect(args).toContain('@src/file2.js');
    });
    
    test('handles single file', () => {
      runBob('test-skill', ['single.js'], { outputFormat: 'json' });
      
      const args = spawnSync.mock.calls[0][1];
      expect(args).toContain('@single.js');
    });
    
    test('handles empty files array', () => {
      runBob('test-skill', [], { outputFormat: 'json' });
      
      const args = spawnSync.mock.calls[0][1];
      const fileArgs = args.filter(arg => arg.startsWith('@'));
      expect(fileArgs.length).toBe(0);
    });
  });
  
  describe('bob command execution', () => {
    beforeEach(() => {
      readFileSync.mockReturnValue('skill content');
    });
    
    test('calls spawnSync with correct command', () => {
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '{}',
        stderr: ''
      });
      
      runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      expect(spawnSync).toHaveBeenCalledWith(
        'bob',
        expect.any(Array),
        expect.any(Object)
      );
    });
    
    test('passes prompt via stdin', () => {
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '{}',
        stderr: ''
      });
      
      runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      expect(spawnSync).toHaveBeenCalledWith(
        'bob',
        expect.any(Array),
        expect.objectContaining({
          input: expect.any(String),
          encoding: 'utf8',
          maxBuffer: 50 * 1024 * 1024
        })
      );
    });
    
    test('throws error when spawnSync fails with error', () => {
      spawnSync.mockReturnValue({
        error: new Error('Command not found')
      });
      
      expect(() => {
        runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      }).toThrow("Bob Shell error running skill 'test-skill': Command not found");
    });
    
    test('throws error when bob exits with non-zero status', () => {
      spawnSync.mockReturnValue({
        status: 1,
        stdout: '',
        stderr: 'Bob error message'
      });
      
      expect(() => {
        runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      }).toThrow("Bob Shell error running skill 'test-skill': Bob error message");
    });
    
    test('truncates long stderr in error message', () => {
      const longError = 'x'.repeat(600);
      spawnSync.mockReturnValue({
        status: 1,
        stdout: '',
        stderr: longError
      });
      
      expect(() => {
        runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      }).toThrow(/\.\.\./);
    });
  });
  
  describe('JSON output parsing', () => {
    beforeEach(() => {
      readFileSync.mockReturnValue('skill content');
    });
    
    test('parses valid JSON object', () => {
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '{"result": "success"}',
        stderr: ''
      });
      
      const result = runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      expect(result).toEqual({ result: 'success' });
    });
    
    test('parses valid JSON array', () => {
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '[{"id": 1}, {"id": 2}]',
        stderr: ''
      });
      
      const result = runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
    
    test('strips markdown code blocks from JSON output', () => {
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '```json\n{"result": "success"}\n```',
        stderr: ''
      });
      
      const result = runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      expect(result).toEqual({ result: 'success' });
    });
    
    test('strips code blocks without language specifier', () => {
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '```\n{"result": "success"}\n```',
        stderr: ''
      });
      
      const result = runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      expect(result).toEqual({ result: 'success' });
    });
    
    test('handles JSON with whitespace', () => {
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '  \n  {"result": "success"}  \n  ',
        stderr: ''
      });
      
      const result = runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      expect(result).toEqual({ result: 'success' });
    });
    
    test('throws error for invalid JSON', () => {
      spawnSync.mockReturnValue({
        status: 0,
        stdout: 'not valid json',
        stderr: ''
      });
      
      expect(() => {
        runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      }).toThrow(/Failed to parse JSON output from skill 'test-skill'/);
    });
    
    test('includes truncated output in JSON parse error', () => {
      const longOutput = 'invalid json ' + 'x'.repeat(600);
      spawnSync.mockReturnValue({
        status: 0,
        stdout: longOutput,
        stderr: ''
      });
      
      expect(() => {
        runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      }).toThrow(/\.\.\./);
    });
    
    test('parses empty JSON object', () => {
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '{}',
        stderr: ''
      });
      
      const result = runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      expect(result).toEqual({});
    });
    
    test('parses empty JSON array', () => {
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '[]',
        stderr: ''
      });
      
      const result = runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      expect(result).toEqual([]);
    });
  });
  
  describe('non-JSON output', () => {
    beforeEach(() => {
      readFileSync.mockReturnValue('skill content');
    });
    
    test('returns raw stdout for markdown output', () => {
      const markdownOutput = '# Report\n\nSome content';
      spawnSync.mockReturnValue({
        status: 0,
        stdout: markdownOutput,
        stderr: ''
      });
      
      const result = runBob('test-skill', ['file.js'], { outputFormat: 'markdown' });
      
      expect(result).toBe(markdownOutput);
    });
    
    test('returns raw stdout when no outputFormat specified', () => {
      const output = 'plain text output';
      spawnSync.mockReturnValue({
        status: 0,
        stdout: output,
        stderr: ''
      });
      
      const result = runBob('test-skill', ['file.js']);
      
      expect(result).toBe(output);
    });
    
    test('preserves whitespace in non-JSON output', () => {
      const output = '  \n  content  \n  ';
      spawnSync.mockReturnValue({
        status: 0,
        stdout: output,
        stderr: ''
      });
      
      const result = runBob('test-skill', ['file.js'], { outputFormat: 'markdown' });
      
      expect(result).toBe(output);
    });
  });
  
  describe('edge cases', () => {
    beforeEach(() => {
      readFileSync.mockReturnValue('skill content');
    });
    
    test('handles multiple options together', () => {
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '{"result": "success"}',
        stderr: ''
      });
      
      const result = runBob('test-skill', ['file1.js', 'file2.js'], {
        outputFormat: 'json',
        yolo: true,
        mode: 'custom'
      });
      
      expect(result).toEqual({ result: 'success' });
      
      const args = spawnSync.mock.calls[0][1];
      expect(args).toContain('--yolo');
      expect(args).toContain('--chat-mode');
      expect(args).toContain('custom');
    });
    
    test('handles skill with complex content', () => {
      const complexContent = 'Line 1\n\nLine 2\n```code```\n# Header';
      readFileSync.mockReturnValue(complexContent);
      spawnSync.mockReturnValue({
        status: 0,
        stdout: '{}',
        stderr: ''
      });
      
      runBob('test-skill', ['file.js'], { outputFormat: 'json' });
      
      expect(spawnSync).toHaveBeenCalledWith(
        'bob',
        expect.any(Array),
        expect.objectContaining({
          input: expect.stringContaining(complexContent)
        })
      );
    });
  });
});
