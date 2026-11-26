import globals from 'globals';
const rules = {
  'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  'no-undef': 'error',
};
export default [
  { ignores: ['node_modules/**', 'generated/**', 'reference/**', 'assets/**', 'fixtures/**'] },
  {
    files: ['src/**/*.mjs', 'scripts/**/*.mjs', 'tools/**/*.{mjs,cjs}', 'tests/**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', globals: globals.node },
    rules,
  },
  { files: ['tools/**/*.{mjs,cjs}'], languageOptions: { globals: globals.browser } },
  {
    files: ['site/**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', globals: globals.browser },
    rules,
  },
];
