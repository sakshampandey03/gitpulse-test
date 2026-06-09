/**
 * Bob API Client - Direct API calls to Bob Shell service
 * Used when Bob CLI is not available (e.g., in CI/CD environments)
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

/**
 * Call Bob API directly with prompt and files
 * @param {string} prompt - The prompt/skill content to send to Bob
 * @param {string[]} files - Array of file paths to analyze
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - Bob's response
 */
export async function callBobApi(prompt, files, options = {}) {
  const apiKey = process.env.BOB_API_KEY;
  
  if (!apiKey) {
    throw new Error('BOB_API_KEY environment variable is required for API mode');
  }

  // Read file contents
  const fileContents = files.map(filePath => {
    try {
      const content = readFileSync(filePath, 'utf8');
      return {
        path: filePath,
        content: content
      };
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
      return null;
    }
  }).filter(Boolean);

  if (fileContents.length === 0) {
    throw new Error('No files could be read for analysis');
  }

  // Construct the full prompt with file contents
  let fullPrompt = prompt + '\n\n';
  fullPrompt += '# Files to Analyze:\n\n';
  
  fileContents.forEach(({ path, content }) => {
    fullPrompt += `## File: ${path}\n\`\`\`\n${content}\n\`\`\`\n\n`;
  });

  if (options.outputFormat === 'json') {
    fullPrompt += '\n\nIMPORTANT: Output ONLY valid JSON. No markdown, no explanations, just pure JSON.';
  }

  // Call Bob API
  const apiUrl = process.env.BOB_API_URL || 'https://api.bob.ibm.com/v1/chat';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        model: options.model || 'gpt-4',
        temperature: 0.1, // Low temperature for consistent output
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bob API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Extract response content
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else if (data.response) {
      return data.response;
    } else {
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error(`Failed to connect to Bob API: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check if Bob CLI is available
 * @returns {boolean}
 */
export function isBobCliAvailable() {
  try {
    execSync('bob --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Made with Bob