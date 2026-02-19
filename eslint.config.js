import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
    // Global ignores
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'electron/**',
            '*.config.js',
            '*.config.ts',
        ],
    },

    // Base JS recommended
    js.configs.recommended,

    // TypeScript recommended
    ...tseslint.configs.recommended,

    // Project-wide settings for src/ and database/
    {
        files: ['src/**/*.{ts,tsx}', 'database/**/*.ts'],
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            // React hooks
            ...reactHooks.configs.recommended.rules,

            // React refresh — warn on non-component exports
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],

            // Unused variables — error on unused, allow _ prefix and ignore caught errors
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],

            // Relax some strict TS rules for the existing codebase
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-require-imports': 'off',

            // General
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'prefer-const': 'warn',
        },
    },

    // Prettier must be last to override formatting rules
    eslintConfigPrettier,
);
