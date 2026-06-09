/**
 * Unit tests for checks/index.js
 * Tests cover file filtering functions, check configuration, and validation
 */

import {
  checks,
  defaultChecks,
  getCheck,
  getAllCheckNames,
  isValidCheck
} from '../index.js';

describe('checks configuration', () => {
  describe('checks object', () => {
    test('contains all expected check configurations', () => {
      const expectedChecks = [
        'security-scan',
        'solid-check',
        'test-generator',
        'readme-writer',
        'flowchart',
        'architecture-diagram',
        'bug-detector',
        'perf-analyzer',
        'onboarding-guide',
        'code-converter'
      ];
      
      expectedChecks.forEach(checkName => {
        expect(checks[checkName]).toBeDefined();
      });
    });
    
    test('each check has required properties', () => {
      Object.values(checks).forEach(check => {
        expect(check).toHaveProperty('skillName');
        expect(check).toHaveProperty('label');
        expect(check).toHaveProperty('outputFormat');
        expect(check).toHaveProperty('fileFilter');
        expect(check).toHaveProperty('description');
      });
    });
    
    test('security-scan has correct configuration', () => {
      expect(checks['security-scan']).toEqual({
        skillName: 'security-scan',
        label: 'Security Scan',
        outputFormat: 'json',
        fileFilter: expect.any(Function),
        description: 'Scans for security vulnerabilities and unsafe patterns'
      });
    });
    
    test('test-generator has markdown output format', () => {
      expect(checks['test-generator'].outputFormat).toBe('markdown');
    });
    
    test('code-converter has alwaysRun file filter', () => {
      const result = checks['code-converter'].fileFilter();
      expect(result).toBe(true);
    });
  });
  
  describe('defaultChecks', () => {
    test('is an array', () => {
      expect(Array.isArray(defaultChecks)).toBe(true);
    });
    
    test('contains expected default checks', () => {
      expect(defaultChecks).toContain('security-scan');
      expect(defaultChecks).toContain('solid-check');
      expect(defaultChecks).toContain('bug-detector');
      expect(defaultChecks).toContain('perf-analyzer');
      expect(defaultChecks).toContain('test-generator');
    });
    
    test('does not contain readme-writer', () => {
      expect(defaultChecks).not.toContain('readme-writer');
    });
    
    test('has exactly 5 checks', () => {
      expect(defaultChecks.length).toBe(5);
    });
  });
});

describe('file filtering functions', () => {
  describe('isSourceFile filter', () => {
    test('accepts JavaScript source files', () => {
      const filter = checks['security-scan'].fileFilter;
      expect(filter('src/index.js')).toBe(true);
      expect(filter('lib/utils.js')).toBe(true);
    });
    
    test('rejects node_modules files', () => {
      const filter = checks['security-scan'].fileFilter;
      expect(filter('node_modules/package/index.js')).toBe(false);
    });
    
    test('rejects .git directory files', () => {
      const filter = checks['security-scan'].fileFilter;
      expect(filter('.git/config')).toBe(false);
    });
    
    test('rejects build output directories', () => {
      const filter = checks['security-scan'].fileFilter;
      expect(filter('dist/bundle.js')).toBe(false);
      expect(filter('build/output.js')).toBe(false);
      expect(filter('coverage/report.html')).toBe(false);
    });
    
    test('rejects JSON files', () => {
      const filter = checks['security-scan'].fileFilter;
      expect(filter('package.json')).toBe(false);
      expect(filter('config.json')).toBe(false);
    });
    
    test('rejects markdown files', () => {
      const filter = checks['security-scan'].fileFilter;
      expect(filter('README.md')).toBe(false);
      expect(filter('docs/guide.md')).toBe(false);
    });
    
    test('rejects config files', () => {
      const filter = checks['security-scan'].fileFilter;
      expect(filter('.eslintrc.yml')).toBe(false);
      expect(filter('config.yaml')).toBe(false);
      expect(filter('package-lock.json')).toBe(false);
    });
    
    test('rejects text files', () => {
      const filter = checks['security-scan'].fileFilter;
      expect(filter('notes.txt')).toBe(false);
    });
  });
  
  describe('isCodeFile filter', () => {
    test('accepts JavaScript/TypeScript files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('src/app.js')).toBe(true);
      expect(filter('src/app.ts')).toBe(true);
      expect(filter('src/Component.jsx')).toBe(true);
      expect(filter('src/Component.tsx')).toBe(true);
    });
    
    test('accepts Java files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('src/Main.java')).toBe(true);
    });
    
    test('accepts Python files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('src/main.py')).toBe(true);
    });
    
    test('accepts Go files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('src/main.go')).toBe(true);
    });
    
    test('accepts Rust files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('src/main.rs')).toBe(true);
    });
    
    test('accepts C/C++ files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('src/main.cpp')).toBe(true);
      expect(filter('src/main.cc')).toBe(true);
      expect(filter('src/main.cxx')).toBe(true);
      expect(filter('src/main.c')).toBe(true);
    });
    
    test('accepts Ruby files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('src/app.rb')).toBe(true);
    });
    
    test('accepts PHP files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('src/index.php')).toBe(true);
    });
    
    test('accepts C# files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('src/Program.cs')).toBe(true);
    });
    
    test('accepts Swift files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('src/App.swift')).toBe(true);
    });
    
    test('accepts Kotlin files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('src/Main.kt')).toBe(true);
      expect(filter('src/script.kts')).toBe(true);
    });
    
    test('rejects non-code files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('README.md')).toBe(false);
      expect(filter('package.json')).toBe(false);
      expect(filter('image.png')).toBe(false);
    });
    
    test('rejects files in node_modules even if code files', () => {
      const filter = checks['solid-check'].fileFilter;
      expect(filter('node_modules/package/index.js')).toBe(false);
    });
  });
  
  describe('isNotTestFile filter', () => {
    test('accepts regular source files', () => {
      const filter = checks['test-generator'].fileFilter;
      expect(filter('src/utils.js')).toBe(true);
      expect(filter('src/UserService.js')).toBe(true);
    });
    
    test('rejects files with .test. in name', () => {
      const filter = checks['test-generator'].fileFilter;
      expect(filter('src/utils.test.js')).toBe(false);
      expect(filter('src/UserService.test.ts')).toBe(false);
    });
    
    test('rejects files with .spec. in name', () => {
      const filter = checks['test-generator'].fileFilter;
      expect(filter('src/utils.spec.js')).toBe(false);
      expect(filter('src/UserService.spec.ts')).toBe(false);
    });
    
    test('rejects files in __tests__ directory', () => {
      const filter = checks['test-generator'].fileFilter;
      expect(filter('src/__tests__/utils.js')).toBe(false);
      expect(filter('__tests__/integration.js')).toBe(false);
    });
    
    test('rejects files in __test__ directory', () => {
      const filter = checks['test-generator'].fileFilter;
      expect(filter('src/__test__/utils.js')).toBe(false);
    });
    
    test('rejects config files', () => {
      const filter = checks['test-generator'].fileFilter;
      expect(filter('package.json')).toBe(false);
    });
  });
  
  describe('alwaysRun filter', () => {
    test('always returns true', () => {
      const filter = checks['readme-writer'].fileFilter;
      expect(filter()).toBe(true);
      expect(filter('any/path')).toBe(true);
      expect(filter('node_modules/file.js')).toBe(true);
      expect(filter('')).toBe(true);
    });
  });
});

describe('getCheck', () => {
  test('returns check configuration for valid check name', () => {
    const check = getCheck('security-scan');
    
    expect(check).toBeDefined();
    expect(check.skillName).toBe('security-scan');
    expect(check.label).toBe('Security Scan');
  });
  
  test('returns correct check for solid-check', () => {
    const check = getCheck('solid-check');
    
    expect(check.skillName).toBe('solid-check');
    expect(check.outputFormat).toBe('json');
  });
  
  test('throws error for invalid check name', () => {
    expect(() => {
      getCheck('invalid-check');
    }).toThrow('Invalid check: invalid-check');
  });
  
  test('throws error for empty string', () => {
    expect(() => {
      getCheck('');
    }).toThrow('Invalid check: ');
  });
  
  test('throws error for null', () => {
    expect(() => {
      getCheck(null);
    }).toThrow();
  });
  
  test('throws error for undefined', () => {
    expect(() => {
      getCheck(undefined);
    }).toThrow();
  });
});

describe('getAllCheckNames', () => {
  test('returns array of all check names', () => {
    const names = getAllCheckNames();
    
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBeGreaterThan(0);
  });
  
  test('includes all expected check names', () => {
    const names = getAllCheckNames();
    
    expect(names).toContain('security-scan');
    expect(names).toContain('solid-check');
    expect(names).toContain('test-generator');
    expect(names).toContain('bug-detector');
    expect(names).toContain('code-converter');
  });
  
  test('returns exactly 10 check names', () => {
    const names = getAllCheckNames();
    expect(names.length).toBe(10);
  });
  
  test('does not contain duplicates', () => {
    const names = getAllCheckNames();
    const uniqueNames = [...new Set(names)];
    
    expect(names.length).toBe(uniqueNames.length);
  });
});

describe('isValidCheck', () => {
  test('returns true for valid check names', () => {
    expect(isValidCheck('security-scan')).toBe(true);
    expect(isValidCheck('solid-check')).toBe(true);
    expect(isValidCheck('test-generator')).toBe(true);
    expect(isValidCheck('bug-detector')).toBe(true);
  });
  
  test('returns false for invalid check names', () => {
    expect(isValidCheck('invalid-check')).toBe(false);
    expect(isValidCheck('nonexistent')).toBe(false);
  });
  
  test('returns false for empty string', () => {
    expect(isValidCheck('')).toBe(false);
  });
  
  test('returns false for null', () => {
    expect(isValidCheck(null)).toBe(false);
  });
  
  test('returns false for undefined', () => {
    expect(isValidCheck(undefined)).toBe(false);
  });
  
  test('is case-sensitive', () => {
    expect(isValidCheck('Security-Scan')).toBe(false);
    expect(isValidCheck('SECURITY-SCAN')).toBe(false);
  });
});
