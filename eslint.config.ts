import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
// import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  {
    files: ['src/**/*.{js,mjs,cjs,ts,mts,cts}', 'tests/**/*.{ts,mts,cts}'],
    plugins: { js, prettier, import: importPlugin },
    extends: ['js/recommended'],
    rules: {
      'prettier/prettier': [
        'warn',
        {
          endOfLine: 'auto',
        },
      ],
      'quotes': ['error', 'double', { 'avoidEscape': true }],
      'import/order': [
        'warn',
        {
          groups: [
            'builtin', // Node.js built-ins (fs, path, etc.)
            'external', // npm packages (react, lodash, etc.)
            'internal', // your own modules (like "@/utils")
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always', // 👈 adds space between groups
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,mts,cts}', 'tests/**/*.{ts,mts,cts}'],
    rules: {
      // TypeScript naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        // Variables, functions, methods - camelCase
        {
          selector: ['variable', 'function', 'method'],
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        // Classes, interfaces, types, enums - PascalCase
        {
          selector: ['class', 'interface', 'typeAlias', 'enum'],
          format: ['PascalCase'],
        },
        // Interface prefix optional
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        // Type parameters - single uppercase letter
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
          custom: {
            regex: '^T[A-Z]|^[A-Z]$',
            match: true,
          },
        },
        // Constants - SCREAMING_SNAKE_CASE or camelCase
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'UPPER_CASE'],
        },
        // Enum members - PascalCase
        {
          selector: 'enumMember',
          format: ['PascalCase'],
        },
        // Properties - camelCase
        {
          selector: 'property',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        // Methods - camelCase
        {
          selector: 'method',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],
      // Other TypeScript conventions
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.json'],
    plugins: { json },
    language: 'json/json',
    extends: ['json/recommended'],
  },
  {
    ignores: ['node_modules', 'dist', 'coverage'],
  },
  // eslintPluginPrettierRecommended,
]);
