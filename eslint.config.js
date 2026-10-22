import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json', sourceType: 'module' },
      globals: { __dirname: 'readonly' }
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
];
