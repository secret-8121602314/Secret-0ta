# ESLint Complete Configuration & Development Guide

Comprehensive guide to ESLint—a pluggable JavaScript linter enabling customizable code quality rules, automatic fixing, and integrated development workflows.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Configuration](#configuration)
3. [Rules](#rules)
4. [Plugins & Extends](#plugins--extends)
5. [Automatic Fixing](#automatic-fixing)
6. [Custom Rules](#custom-rules)
7. [React & TypeScript](#react--typescript)
8. [CI/CD Integration](#cicd-integration)
9. [Performance](#performance)
10. [Best Practices](#best-practices)

## Installation & Setup

### Install ESLint

```bash
npm install eslint --save-dev
```

### Initialize ESLint

```bash
npx eslint --init
```

Or with flat config format (recommended):

```bash
npm install eslint --save-dev
# Create eslint.config.js manually
```

## Configuration

### ESLint Config (Flat Config Format)

```javascript
// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  js.configs.recommended,
];
```

### Legacy Config Format (.eslintrc.json)

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "rules": {
    "no-var": "error",
    "prefer-const": "error",
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "semi": ["error", "always"],
    "quotes": ["error", "single"]
  }
}
```

### Ignore Files

```
# .eslintignore
node_modules/
dist/
build/
coverage/
*.min.js
.next/
```

## Rules

### Common Rules

```javascript
const config = {
  rules: {
    // Best practices
    'eqeqeq': ['error', 'always'],           // Use === instead of ==
    'no-eval': 'error',                      // Disallow eval()
    'no-implied-eval': 'error',              // Disallow implied eval
    'no-with': 'error',                      // Disallow with statement
    'no-floating-decimal': 'error',          // No .5 without leading 0
    
    // Variables
    'no-var': 'error',                       // Use const/let instead
    'prefer-const': 'error',                 // Prefer const when possible
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',               // Ignore args starting with _
      varsIgnorePattern: '^_'
    }],
    'no-shadow': 'warn',                     // Disallow variable shadowing
    'no-undef': 'error',                     // Disallow undefined variables
    
    // Stylistic
    'semi': ['error', 'always'],             // Require semicolons
    'quotes': ['error', 'single', {          // Prefer single quotes
      avoidEscape: true
    }],
    'indent': ['error', 2],                  // 2-space indentation
    'comma-dangle': ['error', 'never'],      // No trailing commas
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // ES6+
    'arrow-spacing': 'error',                // Spaces around arrow functions
    'no-duplicate-imports': 'error',         // No duplicate imports
    'prefer-arrow-callback': 'error',        // Use arrow functions for callbacks
  }
};
```

### Rule Severity Levels

```javascript
const config = {
  rules: {
    'no-var': 'off',      // Disabled
    'prefer-const': 'warn', // Warn (exit code 0)
    'no-eval': 'error'    // Error (exit code 1)
  }
};
```

### Configuring Rules

```javascript
// Error level with options
'no-unused-vars': ['error', {
  vars: 'all',                    // Check all variables
  args: 'after-used',             // Check args after used ones
  argsIgnorePattern: '^_'         // Ignore args starting with _
}]
```

## Plugins & Extends

### Using Extends

```javascript
// eslint.config.js
import js from '@eslint/js';
import eslintRecommended from 'eslint:recommended';

export default [
  {
    ignores: ['node_modules/', 'dist/'],
  },
  eslintRecommended,
  {
    rules: {
      'no-var': 'error',
    },
  },
];
```

### Popular Extends

```javascript
// With legacy config
{
  "extends": [
    "eslint:recommended",           // ESLint recommended rules
    "prettier"                      // Turns off conflicting rules
  ]
}

// Flat config
import eslintRecommended from 'eslint:recommended';

export default [
  eslintRecommended,
];
```

### Using Plugins

```javascript
// eslint.config.js
import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        React: 'readonly'
      }
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
    }
  }
];
```

## Automatic Fixing

### Using --fix Flag

```bash
# Fix all problems automatically
npx eslint . --fix

# Fix specific file
npx eslint src/main.js --fix

# Dry run (show what would be fixed)
npx eslint . --fix-dry-run
```

### Programmatic Fixing

```javascript
import { ESLint } from 'eslint';

async function fixFiles() {
  const eslint = new ESLint({
    fix: true,
    baseConfig: {
      rules: {
        'no-var': 'error'
      }
    }
  });

  const results = await eslint.lintFiles(['src/**/*.js']);
  
  // Write fixed files
  await ESLint.outputFixes(results);

  // Print results
  const formatter = await eslint.loadFormatter('stylish');
  console.log(formatter.format(results));
}

fixFiles();
```

## Custom Rules

### Simple Rule

```javascript
// rules/no-console-log.js
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow console.log() in production',
      category: 'Best Practices'
    },
    fixable: null,
    schema: []
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.object &&
          node.callee.object.name === 'console' &&
          node.callee.property.name === 'log'
        ) {
          context.report({
            node,
            message: 'Unexpected console.log() - use console.error() or console.warn()'
          });
        }
      }
    };
  }
};
```

### Rule with Autofix

```javascript
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Convert var to const'
    },
    fixable: 'code',
  },
  create(context) {
    return {
      VariableDeclaration(node) {
        if (node.kind === 'var' && !node.init) {
          context.report({
            node,
            message: 'Use const instead of var',
            fix(fixer) {
              return fixer.replaceText(node, node.raw.replace('var', 'const'));
            }
          });
        }
      }
    };
  }
};
```

### Rule with Options

```javascript
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce function naming convention'
    },
    schema: [
      {
        type: 'object',
        properties: {
          prefix: {
            type: 'string',
            default: ''
          },
          suffix: {
            type: 'string',
            default: ''
          }
        }
      }
    ]
  },
  create(context) {
    const options = context.options[0] || {};
    const prefix = options.prefix || '';
    const suffix = options.suffix || '';

    return {
      FunctionDeclaration(node) {
        const name = node.id.name;
        const expected = prefix + name.replace(/^function/, '') + suffix;

        if (!name.startsWith(prefix) || !name.endsWith(suffix)) {
          context.report({
            node,
            message: `Function name should follow pattern: ${prefix}*${suffix}`
          });
        }
      }
    };
  }
};
```

### Using Custom Rules

```javascript
// eslint.config.js
import myPlugin from './my-eslint-plugin.js';

export default [
  {
    plugins: {
      'my-plugin': myPlugin
    },
    rules: {
      'my-plugin/no-console-log': 'error',
      'my-plugin/naming-convention': ['error', {
        prefix: 'use',
        suffix: 'State'
      }]
    }
  }
];
```

## React & TypeScript

### React Configuration

```javascript
// eslint.config.js
import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'react-refresh': reactRefreshPlugin
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'warn'
    }
  }
];
```

### TypeScript Configuration

```javascript
// eslint.config.js
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-types': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_'
      }],
      '@typescript-eslint/explicit-member-accessibility': 'warn'
    }
  }
];
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/eslint.yml
name: ESLint

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm run lint:fix
```

### Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

echo "Running ESLint on staged files..."
npx lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": "eslint --fix",
    "*.json": "prettier --write"
  }
}
```

### NPM Scripts

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "lint:report": "eslint . --format json > eslint-report.json"
  }
}
```

## Performance

### Caching

```bash
# ESLint caches by default in .eslintcache
npx eslint . --cache

# Clear cache
npx eslint . --cache --cache-location ./custom-cache
```

### Parallel Linting

```javascript
// lint.js
import { ESLint } from 'eslint';
import { globby } from 'globby';

async function lint() {
  const files = await globby(['src/**/*.js']);
  
  const eslint = new ESLint({
    maxWarnings: 10
  });

  // Lint files (ESLint handles parallelization)
  const results = await eslint.lintFiles(files);
  
  const formatter = await eslint.loadFormatter('stylish');
  console.log(formatter.format(results));
}

lint();
```

## Best Practices

### 1. Start with Recommended Config

```javascript
// eslint.config.js
import js from '@eslint/js';

export default [
  js.configs.recommended
];
```

### 2. Add Plugins Gradually

```javascript
export default [
  js.configs.recommended,
  // Add one plugin at a time
  reactPlugin.configs.recommended,
  typescriptPlugin.configs.recommended
];
```

### 3. Disable Rules Judiciously

```javascript
// ✅ Good - disable with reason
rules: {
  // TODO: Enable after refactoring legacy code
  'no-var': 'off'
}

// ❌ Bad - no context
rules: {
  'no-var': 'off'
}
```

### 4. Use Comments for Exceptions

```javascript
// ✅ Good
/* eslint-disable-next-line no-eval */
eval('const x = 1');

// ✅ Good - multiple rules
/* eslint-disable no-var, no-eval */
var x = 1;
eval('x = 2');
/* eslint-enable no-var, no-eval */

// ❌ Bad - too broad
/* eslint-disable */
// lots of code
/* eslint-enable */
```

### 5. Organize Rules by Category

```javascript
const config = {
  rules: {
    // Best practices
    'eqeqeq': 'error',
    'no-eval': 'error',

    // Variables
    'no-var': 'error',
    'prefer-const': 'error',

    // Stylistic
    'semi': 'error',
    'quotes': 'error',

    // ES6+
    'arrow-spacing': 'error',
    'prefer-arrow-callback': 'error'
  }
};
```

### 6. Combine with Prettier

```javascript
// eslint.config.js
import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'prettier/prettier': 'error'
    }
  }
];
```

### 7. Test Custom Rules

```javascript
// test-rule.js
import rule from './rules/no-console-log.js';
import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();

ruleTester.run('no-console-log', rule, {
  valid: [
    'console.error("error")',
    'console.warn("warning")',
    'logger.log("test")'
  ],
  invalid: [
    {
      code: 'console.log("test")',
      errors: [{ message: 'Unexpected console.log()' }]
    }
  ]
});
```

### 8. Document Configuration

```javascript
// eslint.config.js
/**
 * ESLint Configuration
 * 
 * Rules:
 * - Recommended ESLint rules as baseline
 * - React/React Hooks plugin for React-specific rules
 * - TypeScript plugin for type-aware linting
 * - React Refresh for fast refresh compatibility
 * 
 * Disabled Rules:
 * - react/react-in-jsx-scope: Not needed in React 17+
 * - react/prop-types: Using TypeScript for prop validation
 */
export default [
  // configuration
];
```

## Conclusion

ESLint provides powerful code quality enforcement with a highly extensible plugin system. Combining recommended configurations, React/TypeScript plugins, and custom rules creates a comprehensive linting setup that catches bugs early and enforces consistent code style across projects.
