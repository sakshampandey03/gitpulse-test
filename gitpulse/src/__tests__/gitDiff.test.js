/**
 * Unit tests for gitDiff.js
 * Tests cover git operations, file filtering, and error handling
 */

import { jest } from '@jest/globals';
import simpleGit from 'simple-git';
import { existsSync } from 'fs';

// Mock dependencies
jest.mock('simple-git');
jest.mock('fs');

// Import after mocking
const gitDiffModule = await import('../gitDiff.js');
const gitDiff = gitDiffModule.default;

describe('gitDiff', () => {
  let mockGit;
  
  beforeEach(() => {
    mockGit = {
      diff: jest.fn(),
      raw: jest.fn()
    };
    simpleGit.mockReturnValue(mockGit);
    existsSync.mockReturnValue(true);
    jest.clearAllMocks();
  });
  
  describe('getChangedFiles', () => {
    describe('staged mode', () => {
      test('returns staged files', async () => {
        mockGit.diff.mockResolvedValue('file1.js\nfile2.js\nfile3.js');
        
        const files = await gitDiff.getChangedFiles('staged');
        
        expect(mockGit.diff).toHaveBeenCalledWith(['--cached', '--name-only']);
        expect(files).toEqual(['file1.js', 'file2.js', 'file3.js']);
      });
      
      test('filters out empty lines', async () => {
        mockGit.diff.mockResolvedValue('file1.js\n\nfile2.js\n  \n');
        
        const files = await gitDiff.getChangedFiles('staged');
        
        expect(files).toEqual(['file1.js', 'file2.js']);
      });
      
      test('returns empty array when no staged files', async () => {
        mockGit.diff.mockResolvedValue('');
        
        const files = await gitDiff.getChangedFiles('staged');
        
        expect(files).toEqual([]);
      });
      
      test('filters out non-existent files', async () => {
        mockGit.diff.mockResolvedValue('exists.js\ndeleted.js');
        existsSync.mockImplementation((path) => path === 'exists.js');
        
        const files = await gitDiff.getChangedFiles('staged');
        
        expect(files).toEqual(['exists.js']);
      });
    });
    
    describe('unstaged mode', () => {
      test('returns unstaged files', async () => {
        mockGit.diff.mockResolvedValue('modified.js\nchanged.js');
        
        const files = await gitDiff.getChangedFiles('unstaged');
        
        expect(mockGit.diff).toHaveBeenCalledWith(['--name-only', 'HEAD']);
        expect(files).toEqual(['modified.js', 'changed.js']);
      });
      
      test('returns empty array when no unstaged files', async () => {
        mockGit.diff.mockResolvedValue('');
        
        const files = await gitDiff.getChangedFiles('unstaged');
        
        expect(files).toEqual([]);
      });
      
      test('handles single file', async () => {
        mockGit.diff.mockResolvedValue('single.js');
        
        const files = await gitDiff.getChangedFiles('unstaged');
        
        expect(files).toEqual(['single.js']);
      });
    });
    
    describe('ci mode', () => {
      test('compares against origin/main by default', async () => {
        mockGit.diff.mockResolvedValue('feature.js\nfix.js');
        
        const files = await gitDiff.getChangedFiles('ci');
        
        expect(mockGit.diff).toHaveBeenCalledWith(['--name-only', 'origin/main...HEAD']);
        expect(files).toEqual(['feature.js', 'fix.js']);
      });
      
      test('uses custom base branch from environment variable', async () => {
        const originalEnv = process.env.GITPULSE_BASE_BRANCH;
        process.env.GITPULSE_BASE_BRANCH = 'origin/develop';
        
        mockGit.diff.mockResolvedValue('feature.js');
        
        const files = await gitDiff.getChangedFiles('ci');
        
        expect(mockGit.diff).toHaveBeenCalledWith(['--name-only', 'origin/develop...HEAD']);
        
        // Restore environment
        if (originalEnv) {
          process.env.GITPULSE_BASE_BRANCH = originalEnv;
        } else {
          delete process.env.GITPULSE_BASE_BRANCH;
        }
      });
      
      test('returns empty array when no changes vs base branch', async () => {
        mockGit.diff.mockResolvedValue('');
        
        const files = await gitDiff.getChangedFiles('ci');
        
        expect(files).toEqual([]);
      });
    });
    
    describe('all mode', () => {
      test('combines staged and unstaged files', async () => {
        mockGit.diff
          .mockResolvedValueOnce('staged1.js\nstaged2.js')  // staged
          .mockResolvedValueOnce('unstaged1.js\nunstaged2.js');  // unstaged
        
        const files = await gitDiff.getChangedFiles('all');
        
        expect(mockGit.diff).toHaveBeenCalledWith(['--cached', '--name-only']);
        expect(mockGit.diff).toHaveBeenCalledWith(['--name-only', 'HEAD']);
        expect(files).toEqual(['staged1.js', 'staged2.js', 'unstaged1.js', 'unstaged2.js']);
      });
      
      test('deduplicates files present in both staged and unstaged', async () => {
        mockGit.diff
          .mockResolvedValueOnce('file1.js\nfile2.js')  // staged
          .mockResolvedValueOnce('file2.js\nfile3.js');  // unstaged
        
        const files = await gitDiff.getChangedFiles('all');
        
        expect(files).toEqual(['file1.js', 'file2.js', 'file3.js']);
      });
      
      test('returns empty array when no staged or unstaged files', async () => {
        mockGit.diff
          .mockResolvedValueOnce('')  // staged
          .mockResolvedValueOnce('');  // unstaged
        
        const files = await gitDiff.getChangedFiles('all');
        
        expect(files).toEqual([]);
      });
      
      test('handles only staged files', async () => {
        mockGit.diff
          .mockResolvedValueOnce('staged.js')  // staged
          .mockResolvedValueOnce('');  // unstaged
        
        const files = await gitDiff.getChangedFiles('all');
        
        expect(files).toEqual(['staged.js']);
      });
      
      test('handles only unstaged files', async () => {
        mockGit.diff
          .mockResolvedValueOnce('')  // staged
          .mockResolvedValueOnce('unstaged.js');  // unstaged
        
        const files = await gitDiff.getChangedFiles('all');
        
        expect(files).toEqual(['unstaged.js']);
      });
    });
    
    describe('invalid mode', () => {
      test('throws error for invalid mode', async () => {
        await expect(gitDiff.getChangedFiles('invalid')).rejects.toThrow(
          'Invalid mode parameter: invalid. Must be one of: staged, unstaged, ci, all'
        );
      });
      
      test('throws error for empty string mode', async () => {
        await expect(gitDiff.getChangedFiles('')).rejects.toThrow(
          'Invalid mode parameter'
        );
      });
      
      test('throws error for null mode', async () => {
        await expect(gitDiff.getChangedFiles(null)).rejects.toThrow(
          'Invalid mode parameter'
        );
      });
      
      test('throws error for undefined mode', async () => {
        await expect(gitDiff.getChangedFiles(undefined)).rejects.toThrow(
          'Invalid mode parameter'
        );
      });
    });
    
    describe('error handling', () => {
      test('throws error when not in git repository', async () => {
        mockGit.diff.mockRejectedValue(new Error('not a git repository'));
        
        await expect(gitDiff.getChangedFiles('staged')).rejects.toThrow(
          'Not a git repository. Please run this command from within a git repository.'
        );
      });
      
      test('throws error when git is not installed', async () => {
        mockGit.diff.mockRejectedValue(new Error('git not found'));
        
        await expect(gitDiff.getChangedFiles('staged')).rejects.toThrow(
          'Git is not installed or not in PATH. Please install git to use this tool.'
        );
      });
      
      test('throws error when git command fails', async () => {
        mockGit.diff.mockRejectedValue(new Error('fatal: bad revision'));
        
        await expect(gitDiff.getChangedFiles('staged')).rejects.toThrow(
          'Git error while getting changed files: fatal: bad revision'
        );
      });
      
      test('preserves invalid mode error over git errors', async () => {
        mockGit.diff.mockRejectedValue(new Error('git error'));
        
        await expect(gitDiff.getChangedFiles('invalid')).rejects.toThrow(
          'Invalid mode parameter'
        );
      });
    });
    
    describe('file existence filtering', () => {
      test('includes only existing files', async () => {
        mockGit.diff.mockResolvedValue('exists.js\ndeleted.js\nalso-exists.js');
        existsSync.mockImplementation((path) => 
          path === 'exists.js' || path === 'also-exists.js'
        );
        
        const files = await gitDiff.getChangedFiles('staged');
        
        expect(files).toEqual(['exists.js', 'also-exists.js']);
      });
      
      test('returns empty array when all files are deleted', async () => {
        mockGit.diff.mockResolvedValue('deleted1.js\ndeleted2.js');
        existsSync.mockReturnValue(false);
        
        const files = await gitDiff.getChangedFiles('staged');
        
        expect(files).toEqual([]);
      });
      
      test('checks existence for each file', async () => {
        mockGit.diff.mockResolvedValue('file1.js\nfile2.js\nfile3.js');
        
        await gitDiff.getChangedFiles('staged');
        
        expect(existsSync).toHaveBeenCalledWith('file1.js');
        expect(existsSync).toHaveBeenCalledWith('file2.js');
        expect(existsSync).toHaveBeenCalledWith('file3.js');
      });
    });
  });
  
  describe('isGitRepo', () => {
    test('returns true when inside git repository', async () => {
      mockGit.raw.mockResolvedValue('true');
      
      const result = await gitDiff.isGitRepo();
      
      expect(result).toBe(true);
      expect(mockGit.raw).toHaveBeenCalledWith(['rev-parse', '--is-inside-work-tree']);
    });
    
    test('returns false when not inside git repository', async () => {
      mockGit.raw.mockRejectedValue(new Error('not a git repository'));
      
      const result = await gitDiff.isGitRepo();
      
      expect(result).toBe(false);
    });
    
    test('returns false when git command fails', async () => {
      mockGit.raw.mockRejectedValue(new Error('git not found'));
      
      const result = await gitDiff.isGitRepo();
      
      expect(result).toBe(false);
    });
    
    test('returns false for any error', async () => {
      mockGit.raw.mockRejectedValue(new Error('unknown error'));
      
      const result = await gitDiff.isGitRepo();
      
      expect(result).toBe(false);
    });
  });
  
  describe('getRepoRoot', () => {
    test('returns repository root path', async () => {
      mockGit.raw.mockResolvedValue('/home/user/project\n');
      
      const root = await gitDiff.getRepoRoot();
      
      expect(root).toBe('/home/user/project');
      expect(mockGit.raw).toHaveBeenCalledWith(['rev-parse', '--show-toplevel']);
    });
    
    test('trims whitespace from result', async () => {
      mockGit.raw.mockResolvedValue('  /home/user/project  \n  ');
      
      const root = await gitDiff.getRepoRoot();
      
      expect(root).toBe('/home/user/project');
    });
    
    test('throws error when not in git repository', async () => {
      mockGit.raw.mockRejectedValue(new Error('not a git repository'));
      
      await expect(gitDiff.getRepoRoot()).rejects.toThrow(
        'Not a git repository. Cannot determine repository root.'
      );
    });
    
    test('throws error when git is not installed', async () => {
      mockGit.raw.mockRejectedValue(new Error('git not found'));
      
      await expect(gitDiff.getRepoRoot()).rejects.toThrow(
        'Git is not installed or not in PATH. Please install git to use this tool.'
      );
    });
    
    test('throws error when git command fails', async () => {
      mockGit.raw.mockRejectedValue(new Error('fatal: unknown error'));
      
      await expect(gitDiff.getRepoRoot()).rejects.toThrow(
        'Git error while getting repository root: fatal: unknown error'
      );
    });
    
    test('handles paths with spaces', async () => {
      mockGit.raw.mockResolvedValue('/home/user/my project/repo');
      
      const root = await gitDiff.getRepoRoot();
      
      expect(root).toBe('/home/user/my project/repo');
    });
    
    test('handles Windows-style paths', async () => {
      mockGit.raw.mockResolvedValue('C:\\Users\\user\\project');
      
      const root = await gitDiff.getRepoRoot();
      
      expect(root).toBe('C:\\Users\\user\\project');
    });
  });
});
