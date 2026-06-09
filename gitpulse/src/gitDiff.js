import simpleGit from 'simple-git';
import { existsSync } from 'fs';

const git = simpleGit();

/**
 * Gets a list of changed files based on the specified mode.
 * 
 * @param {'staged'|'unstaged'|'ci'|'all'} mode - The mode to determine which files to retrieve
 *   - "staged": Files staged for commit (git diff --cached --name-only)
 *   - "unstaged": Files changed since last commit (git diff --name-only HEAD)
 *   - "ci": Files changed in this branch vs main (git diff --name-only origin/main...HEAD)
 *   - "all": Combination of staged + unstaged, deduplicated
 * @returns {Promise<string[]>} Array of file paths that exist in the filesystem
 * @throws {Error} If git command fails or git is not installed
 * 
 * @example
 * const stagedFiles = await getChangedFiles('staged');
 * const allFiles = await getChangedFiles('all');
 */
async function getChangedFiles(mode) {
  let files = [];
  
  try {
    switch (mode) {
      case 'staged': {
        // Get files staged for commit
        const result = await git.diff(['--cached', '--name-only']);
        files = result.split('\n').filter(f => f.trim());
        break;
      }
      
      case 'unstaged': {
        // Get files changed since last commit
        const result = await git.diff(['--name-only', 'HEAD']);
        files = result.split('\n').filter(f => f.trim());
        break;
      }
      
      case 'ci': {
        // Get files changed in this branch vs base branch (configurable via env var)
        const baseBranch = process.env.GITPULSE_BASE_BRANCH || 'origin/main';
        const result = await git.diff(['--name-only', `${baseBranch}...HEAD`]);
        files = result.split('\n').filter(f => f.trim());
        break;
      }
      
      case 'all': {
        // Get both staged and unstaged files, deduplicated
        const stagedResult = await git.diff(['--cached', '--name-only']);
        const unstagedResult = await git.diff(['--name-only', 'HEAD']);
        
        const stagedFiles = stagedResult.split('\n').filter(f => f.trim());
        const unstagedFiles = unstagedResult.split('\n').filter(f => f.trim());
        
        // Deduplicate using Set
        files = [...new Set([...stagedFiles, ...unstagedFiles])];
        break;
      }
      
      default:
        throw new Error(`Invalid mode parameter: ${mode}. Must be one of: staged, unstaged, ci, all`);
    }
    
    // Add explicit check and debug log for empty results
    if (files.length === 0) {
      console.log(`Debug: No files found in git diff for mode '${mode}'`);
    }
    
    // Filter to only include files that still exist
    const existingFiles = files.filter(file => existsSync(file));
    
    return existingFiles;
    
  } catch (error) {
    // Separate invalid mode errors from git errors
    if (error.message.includes('Invalid mode parameter')) {
      throw error;
    }
    if (error.message.includes('not a git repository')) {
      throw new Error('Not a git repository. Please run this command from within a git repository.');
    }
    if (error.message.includes('git not found') || error.message.includes('command not found')) {
      throw new Error('Git is not installed or not in PATH. Please install git to use this tool.');
    }
    throw new Error(`Git error while getting changed files: ${error.message}`);
  }
}

/**
 * Checks if the current working directory is inside a git repository.
 * 
 * @returns {Promise<boolean>} True if inside a git repository, false otherwise
 * 
 * @example
 * if (await isGitRepo()) {
 *   console.log('This is a git repository');
 * }
 */
async function isGitRepo() {
  try {
    await git.raw(['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the absolute path to the git repository root.
 * 
 * @returns {Promise<string>} Absolute path to the repository root
 * @throws {Error} If not in a git repository or git command fails
 * 
 * @example
 * const repoRoot = await getRepoRoot();
 * console.log(`Repository root: ${repoRoot}`);
 */
async function getRepoRoot() {
  try {
    const result = await git.raw(['rev-parse', '--show-toplevel']);
    return result.trim();
  } catch (error) {
    if (error.message.includes('not a git repository')) {
      throw new Error('Not a git repository. Cannot determine repository root.');
    }
    if (error.message.includes('git not found') || error.message.includes('command not found')) {
      throw new Error('Git is not installed or not in PATH. Please install git to use this tool.');
    }
    throw new Error(`Git error while getting repository root: ${error.message}`);
  }
}

// Export all methods as a default object
export default {
  getChangedFiles,
  isGitRepo,
  getRepoRoot
};

// Made with Bob
