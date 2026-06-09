import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Executes a Bob skill with specified files and options.
 *
 * @param {string} skillName - The name of the skill (matches folder name in .bob/skills/)
 * @param {string[]} files - Array of file paths to pass as @file references
 * @param {Object} [options={}] - Additional options
 * @param {'json'|'markdown'} [options.outputFormat] - Desired output format
 * @param {boolean} [options.yolo] - If true, adds --yolo flag to bob command
 * @param {string} [options.mode] - Custom mode slug to pass to bob
 * @param {boolean} [options.useNativeSkills] - If true, use native Bob skill discovery instead of manual injection
 * @returns {Object|string} Parsed JSON object/array if outputFormat is 'json', otherwise raw string
 * @throws {Error} If skill not found, bob command fails, or JSON parsing fails
 *
 * @example
 * // Run a skill with JSON output
 * const result = runBob('analyze-code', ['src/index.js'], { outputFormat: 'json' });
 *
 * @example
 * // Run a skill with markdown output and yolo mode
 * const report = runBob('generate-report', ['README.md'], {
 *   outputFormat: 'markdown',
 *   yolo: true
 * });
 *
 * @example
 * // Run a skill with native Bob skill discovery
 * const result = runBob('security-scan', ['src/app.js'], {
 *   outputFormat: 'json',
 *   useNativeSkills: true
 * });
 */
export default function runBob(skillName, files, options = {}) {
  // Validate skillName parameter to prevent path traversal
  if (!/^[a-z0-9-]+$/.test(skillName)) {
    throw new Error(`Invalid skill name '${skillName}'. Skill names must contain only lowercase letters, numbers, and hyphens.`);
  }
  
  // Validate files parameter is an array
  if (!Array.isArray(files)) {
    throw new Error('files must be an array');
  }
  
  // Step 1-4: Build the prompt string
  let prompt;
  
  if (options.useNativeSkills) {
    // Native mode: Create a task description and let Bob discover the skill
    prompt = `Analyze the provided files for ${skillName} issues.`;
  } else {
    // Manual injection mode (default): Read and inject SKILL.md content
    const skillPath = join('.bob', 'skills', skillName, 'SKILL.md');
    
    try {
      prompt = readFileSync(skillPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Skill '${skillName}' not found at ${skillPath}`);
      }
      throw error;
    }
  }
  
  if (options.outputFormat === 'json') {
    prompt += '\n\nOutput only valid JSON.';
  } else if (options.outputFormat === 'markdown') {
    prompt += '\n\nOutput only Markdown.';
  }
  
  // Step 5: Build the command arguments array
  const args = [];
  
  // Add optional flags BEFORE positional arguments
  if (options.yolo) {
    args.push('--yolo');
  }
  
  // Hide intermediary output to get clean JSON/Markdown
  args.push('--hide-intermediary-output');
  
  if (options.mode) {
    args.push('--chat-mode', options.mode);
  }
  
  // Add file references
  files.forEach(f => args.push(`@${f}`));
  
  // Step 6: Execute using spawnSync with prompt via stdin
  const result = spawnSync('bob', args, {
    input: prompt,  // Pass prompt via stdin instead of as argument
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024 // 50MB buffer
  });
  
  // Step 7: Handle execution errors
  if (result.error) {
    throw new Error(`Bob Shell error running skill '${skillName}': ${result.error.message}`);
  }
  
  if (result.status !== 0) {
    // Truncate stderr output for error message
    const truncatedStderr = result.stderr.length > 500
      ? result.stderr.substring(0, 500) + '...'
      : result.stderr;
    throw new Error(`Bob Shell error running skill '${skillName}': ${truncatedStderr}`);
  }
  
  let stdout = result.stdout;
  
  // Step 8: If outputFormat is "json", attempt JSON.parse
  if (options.outputFormat === 'json') {
    // Strip markdown code blocks if present (```json ... ```)
    stdout = stdout.trim();
    if (stdout.startsWith('```')) {
      // Remove opening ```json or ```
      stdout = stdout.replace(/^```(?:json)?\s*\n/, '');
      // Remove closing ```
      stdout = stdout.replace(/\n```\s*$/, '');
      stdout = stdout.trim();
    }
    
    try {
      return JSON.parse(stdout);
    } catch (parseError) {
      // If parse fails, throw with truncated raw output for debugging
      const truncatedOutput = stdout.length > 500
        ? stdout.substring(0, 500) + '...'
        : stdout;
      throw new Error(
        `Failed to parse JSON output from skill '${skillName}': ${parseError.message}\n\nRaw output:\n${truncatedOutput}`
      );
    }
  }
  
  // Step 9: Return the result
  return stdout;
}

// Made with Bob
