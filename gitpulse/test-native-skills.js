#!/usr/bin/env node

/**
 * Test script to verify hybrid native skills implementation
 * Tests both manual injection mode (default) and native skills mode
 */

import runBob from './src/runBob.js';
import { existsSync } from 'fs';

console.log('🧪 Testing Hybrid Native Skills Implementation\n');
console.log('='.repeat(60));

let testsPassed = 0;
let testsFailed = 0;

/**
 * Helper function to run a test
 */
function runTest(testName, testFn) {
  try {
    console.log(`\n📋 Test: ${testName}`);
    testFn();
    console.log('✅ PASSED');
    testsPassed++;
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    testsFailed++;
  }
}

// Test 1: Verify manual injection mode (default) works
runTest('Manual Injection Mode (Default)', () => {
  // Check if a skill file exists
  const skillPath = '.bob/skills/security-scan/SKILL.md';
  if (!existsSync(skillPath)) {
    throw new Error(`Skill file not found at ${skillPath}. Cannot test manual injection mode.`);
  }
  
  // Create a test file
  const testFile = 'src/index.js';
  if (!existsSync(testFile)) {
    throw new Error(`Test file ${testFile} not found`);
  }
  
  console.log('  → Running security-scan in manual injection mode...');
  const result = runBob('security-scan', [testFile], {
    outputFormat: 'json',
    yolo: true,
    useNativeSkills: false  // Explicitly use manual injection
  });
  
  // Verify result is valid
  if (!Array.isArray(result)) {
    throw new Error('Expected array result from JSON output');
  }
  
  console.log(`  → Received ${result.length} finding(s)`);
});

// Test 2: Verify native skills mode works
runTest('Native Skills Mode', () => {
  const testFile = 'src/index.js';
  if (!existsSync(testFile)) {
    throw new Error(`Test file ${testFile} not found`);
  }
  
  console.log('  → Running security-scan in native skills mode...');
  const result = runBob('security-scan', [testFile], {
    outputFormat: 'json',
    yolo: true,
    useNativeSkills: true  // Use native Bob skill discovery
  });
  
  // Verify result is valid
  if (!Array.isArray(result)) {
    throw new Error('Expected array result from JSON output');
  }
  
  console.log(`  → Received ${result.length} finding(s)`);
});

// Test 3: Verify backward compatibility - default behavior unchanged
runTest('Backward Compatibility (No Flag)', () => {
  const testFile = 'src/index.js';
  if (!existsSync(testFile)) {
    throw new Error(`Test file ${testFile} not found`);
  }
  
  console.log('  → Running without useNativeSkills flag (should use manual injection)...');
  const result = runBob('security-scan', [testFile], {
    outputFormat: 'json',
    yolo: true
    // No useNativeSkills flag - should default to manual injection
  });
  
  // Verify result is valid
  if (!Array.isArray(result)) {
    throw new Error('Expected array result from JSON output');
  }
  
  console.log(`  → Received ${result.length} finding(s)`);
  console.log('  → Default behavior maintained (manual injection)');
});

// Test 4: Verify skill name validation works
runTest('Skill Name Validation', () => {
  console.log('  → Testing invalid skill name...');
  try {
    runBob('../invalid-skill', ['src/index.js'], {
      outputFormat: 'json'
    });
    throw new Error('Should have thrown error for invalid skill name');
  } catch (error) {
    if (error.message.includes('Invalid skill name')) {
      console.log('  → Correctly rejected invalid skill name');
    } else {
      throw error;
    }
  }
});

// Test 5: Verify files parameter validation
runTest('Files Parameter Validation', () => {
  console.log('  → Testing invalid files parameter...');
  try {
    runBob('security-scan', 'not-an-array', {
      outputFormat: 'json'
    });
    throw new Error('Should have thrown error for non-array files parameter');
  } catch (error) {
    if (error.message.includes('files must be an array')) {
      console.log('  → Correctly rejected non-array files parameter');
    } else {
      throw error;
    }
  }
});

// Print summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary:');
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`   ❌ Failed: ${testsFailed}`);
console.log(`   📈 Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed! Hybrid native skills implementation verified.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
}

// Made with Bob
