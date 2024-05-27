import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import angular from '@angular-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['*.ts'],
    parserOptions: {
      project: ['tsconfig.json'],
      createDefaultProgram: true
    },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@angular-eslint/recommended',
      'plugin:@angular-eslint/template/process-inline-templates',
      'prettier'
    ],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case'
        }
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase'
        }
      ],
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/explicit-member-accessibility': [
        'off',
        {
          accessibility: 'explicit'
        }
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: ['UPPER_CASE', 'StrictPascalCase'],
          selector: ['enumMember']
        }
      ],
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'arrow-body-style': ['off', 'as-needed'],
      'brace-style': ['error', '1tbs'],
      'id-blacklist': 'off',
      'id-match': 'off',
      'no-bitwise': 'off',
      'no-underscore-dangle': 'off'
    }
  },
  {
    files: ['*.html'],
    extends: ['plugin:@angular-eslint/template/recommended', 'prettier']
  }
];
