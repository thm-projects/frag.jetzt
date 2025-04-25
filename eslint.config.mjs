import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**"  // Also ignore coverage reports
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
    rules: {
      // Improved rule configuration
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-empty-function': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
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
  }
);