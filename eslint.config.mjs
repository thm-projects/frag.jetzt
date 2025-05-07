import tseslint from 'typescript-eslint';
import angularEslint from '@angular-eslint/eslint-plugin';

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",  // Also ignore coverage reports
      "src/modules/m3/utility/*.js", // Ignore problematic JS files
      "**/introduction-prompt-guide-chatbot/**/*" // Ignoriere problematische Chatbot-Komponenten
    ]
  },
  // Add typescript-eslint recommended configurations
  ...tseslint.configs.recommended,
  
  // Add specific configuration for TypeScript files
  {
    files: ['**/*.ts', '**/*.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@angular-eslint': angularEslint
    },
    rules: {
      // Improved rule configuration
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn', // Changed from error to warning
      '@typescript-eslint/no-require-imports': 'warn', // Changed from error to warning
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      
      // Angular ESLint Rules
      '@angular-eslint/component-selector': 'warn',
      '@angular-eslint/directive-selector': 'warn',
      '@angular-eslint/no-input-rename': 'warn'
    },
  },
  
  // Special configuration for test files
  {
    files: ['**/*.spec.ts'],
    rules: {
      // Relax certain rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      'max-nested-callbacks': 'off',
      'no-console': 'off', // Allow console in tests
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  
  // Configuration for JS files
  {
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'warn'
    }
  }
);