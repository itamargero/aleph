import js from '@eslint/js';
import globals from 'globals';

// The legacy JSX sources share a single build-time bundle. Declare those shared
// names here so lint can still catch misspellings and missing browser APIs.
const shared = Object.fromEntries([
  'React', 'ReactDOM', 'LETTERS', 'WORDS', 'AREAS', 'LEVEL_ORDER', 'Icon', 'Mascot',
  'Confetti', 'ExerciseRenderer', 'AudioButton', 'WorldMap', 'AreaView',
  'LevelPreview', 'LevelComplete', 'StickerBook', 'TopBar', 'OfflineBadge',
].map(name => [name, 'readonly']));

export default [
  { ignores: ['node_modules/**', '.next/**', 'public/game.js', 'public/sw.js', 'public/tweaks-panel.jsx', '.playwright-cli/**', 'output/**', '**/*.ts', '**/*.tsx', 'design-reference/**'] },
  { ...js.configs.recommended, files: ['**/*.{js,jsx,mjs}'], languageOptions: {
    ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } },
    globals: { ...globals.browser, ...globals.node, ...globals.serviceworker, ...shared },
  }, rules: { ...js.configs.recommended.rules, 'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z]', caughtErrorsIgnorePattern: '^_' }], 'no-empty': ['error', { allowEmptyCatch: true }] } },
];
