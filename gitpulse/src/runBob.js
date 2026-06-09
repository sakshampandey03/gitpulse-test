import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { callBobApi, isBobCliAvailable } from './bobApi.js';

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
export default async function runBob(skillName, files, options = {}) {
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
  
  // Check if Bob CLI is available, if not use API
  const useCli = isBobCliAvailable();
  
  if (!useCli) {
    console.log('ℹ️  Bob CLI not available, using API mode...');
    return await runBobViaApi(prompt, files, options);
  }
  
  // Step 5: Build the command arguments array
  const args = [];

// Add auth method for CI/CD environments
const useApiKeyAuth = process.env.CI || process.env.BOBSHELL_API_KEY;

if (useApiKeyAuth) {
  args.push('--auth-method', 'api-key');
}

// Add optional flags BEFORE positional arguments
// Don't use --yolo with API key auth (they conflict)
if (options.yolo && !useApiKeyAuth) {
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

/**
 * Run Bob via API when CLI is not available
 */
async function runBobViaApi(prompt, files, options) {
  try {
    const response = await callBobApi(prompt, files, options);
    
    // Process response similar to CLI output
    let output = response.trim();
    
    if (options.outputFormat === 'json') {
      // Strip markdown code blocks if present
      if (output.startsWith('```')) {
        output = output.replace(/^```(?:json)?\s*\n/, '');
        output = output.replace(/\n```\s*$/, '');
        output = output.trim();
      }
      
      try {
        return JSON.parse(output);
      } catch (parseError) {
        const truncatedOutput = output.length > 500
          ? output.substring(0, 500) + '...'
          : output;
        throw new Error(
          `Failed to parse JSON output from API: ${parseError.message}\n\nRaw output:\n${truncatedOutput}`
        );
      }
    }
    
    return output;
  } catch (error) {
    throw new Error(`Bob API error: ${error.message}`);
  }
}

// Made with Bob
