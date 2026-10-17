// alphanull house style (core + @stylistic + jsdoc) plus type-aware typescript-eslint and react-hooks.
// TSDoc mode: types live in TypeScript signatures, not in JSDoc tags.

import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import jsdoc from 'eslint-plugin-jsdoc';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

const tsdocSettings = {
    mode: 'typescript',
    tagNamePreference: {
        remove: 'remove',
        endremove: 'endremove'
    },
    preferredTypes: {
        object: 'Object'
    },
    structuredTags: {
        event: {
            name: 'text',
            type: true
        },
        listens: {
            name: 'text',
            type: true
        },
        fires: {
            name: 'text',
            type: true
        }
    }
};

// No inline `{Type}` tags; no redundant @param/@returns
const tsdocRules = {
    'jsdoc/no-types': 'warn',
    'jsdoc/require-param': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/require-returns-type': 'off',
    'jsdoc/require-property-type': 'off',
    'jsdoc/require-template': 'off',
    'jsdoc/require-throws': 'off',
    'jsdoc/check-types': 'off',
    'jsdoc/valid-types': 'off',
};

// Type-aware recommended minus `no-unsafe-*` (Payload JSON/`any` boundaries).
const typeAwareTsRules = {
    // Prefer TS variants over core duplicates where both exist.
    'require-await': 'off',
    'no-implied-eval': 'off',
    'prefer-promise-reject-errors': 'off',

    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/require-await': 'error',

    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-enum-comparison': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-unary-minus': 'off',
};

const reactHooksRules = {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
};

// House-style rules (core + @stylistic + jsdoc)
const commonRules = {
    // Core
    'accessor-pairs': 'error',
    'array-callback-return': 'error',
    'arrow-body-style': ['warn', 'as-needed'],
    'block-scoped-var': 'error',
    'camelcase': ['error', { properties: 'always' }],
    'class-methods-use-this': 'warn',
    'capitalized-comments': 0,
    'curly': ['warn', 'multi-line'],
    'default-case-last': 'warn',
    'dot-notation': 'warn',
    'eqeqeq': 'error',
    'func-style': 0,
    'func-name-matching': 'warn',
    'grouped-accessor-pairs': 'warn',
    'guard-for-in': 'error',
    'max-classes-per-file': ['warn', 1],
    'max-depth': ['warn', 5],
    'max-lines': ['warn', { max: 999, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', 150],
    'max-nested-callbacks': ['warn', 3],
    'max-params': ['warn', 5],
    'max-statements': ['warn', 100],
    'new-cap': ['warn', { newIsCap: true, capIsNew: false }],
    'no-alert': 'error',
    'no-array-constructor': 'error',
    // Lexical (and similar) encode flags as bitfields; `&`/`|` there are the API, not a smell.
    'no-bitwise': 'off',
    'no-caller': 'error',
    'no-console': 'warn',
    'no-div-regex': 'error',
    'no-duplicate-imports': 'error',
    'no-else-return': 'warn',
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-eq-null': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-label': 'error',
    'no-implicit-globals': 'error',
    'no-implicit-coercion': 'error',
    'no-implied-eval': 'error',
    'no-invalid-this': 'error',
    'no-inline-comments': 0,
    'no-iterator': 'error',
    'no-labels': 'error',
    'no-label-var': 'error',
    'no-lone-blocks': 'warn',
    'no-loop-func': 'warn',
    'no-lonely-if': 'warn',
    'no-multi-str': 'warn',
    'no-negated-condition': 'warn',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-object-constructor': 'error',
    'no-octal-escape': 'warn',
    'no-param-reassign': 'warn',
    'no-plusplus': 'warn',
    'no-proto': 'error',
    'no-promise-executor-return': 'warn',
    'no-restricted-syntax': ['warn', 'WithStatement'],
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'warn',
    'no-shadow': ['error', { builtinGlobals: false, allow: ['_'] }],
    'no-script-url': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unneeded-ternary': 'warn',
    'no-unreachable-loop': 'error',
    'no-unused-expressions': 'error',
    'no-undef-init': 'error',
    'no-use-before-define': ['error', { functions: false }],
    'no-useless-assignment': 'error',
    'no-useless-concat': 'error',
    'no-useless-call': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-constructor': 'error',
    'no-useless-return': 'warn',
    'no-useless-rename': 'warn',
    'no-var': 'error',
    // Off: `void promise` is the intentional marker for fire-and-forget (see
    // `@typescript-eslint/no-floating-promises`).
    'no-void': 'off',
    'object-shorthand': 'warn',
    'operator-assignment': ['warn', 'always'],
    'prefer-arrow-callback': 'warn',
    'prefer-const': 1,
    'prefer-destructuring': ['warn', { VariableDeclarator: { array: false, object: true }, AssignmentExpression: { array: false, object: true } }, { enforceForRenamedProperties: false }],
    'prefer-exponentiation-operator': 'warn',
    'prefer-promise-reject-errors': 'error',
    'prefer-regex-literals': 'warn',
    'prefer-rest-params': 'warn',
    'prefer-spread': 'warn',
    'prefer-template': 'warn',
    'prefer-object-spread': 'warn',
    'require-atomic-updates': 'warn',
    'require-await': 'warn',
    'strict': ['error', 'function'],
    'yoda': 'error',

    // Stylistic
    '@stylistic/jsx-one-expression-per-line': 0,
    '@stylistic/arrow-parens': ['warn', 'as-needed'],
    '@stylistic/arrow-spacing': 'warn',
    '@stylistic/array-bracket-spacing': ['warn', 'never'],
    '@stylistic/array-element-newline': ['warn', 'consistent'],
    '@stylistic/block-spacing': 'warn',
    '@stylistic/brace-style': ['warn', '1tbs', { allowSingleLine: true }],
    '@stylistic/comma-dangle': ['warn', 'always-multiline'],
    '@stylistic/comma-spacing': ['warn', { before: false, after: true }],
    '@stylistic/computed-property-spacing': ['warn', 'never'],
    '@stylistic/curly-newline': ['warn', { multiline: true, minElements: 2, consistent: true }],
    '@stylistic/dot-location': ['warn', 'property'],
    '@stylistic/eol-last': 'warn',
    '@stylistic/function-call-argument-newline': ['warn', 'consistent'],
    '@stylistic/function-call-spacing': ['warn', 'never'],
    '@stylistic/generator-star-spacing': ['warn', { before: true, after: true }],
    '@stylistic/implicit-arrow-linebreak': 'warn',
    '@stylistic/indent': ['warn', 4, { SwitchCase: 1, VariableDeclarator: 'first', ignoredNodes: ["CallExpression[callee.name='define']"] }],
    '@stylistic/key-spacing': ['warn', { beforeColon: false, afterColon: true }],
    '@stylistic/keyword-spacing': ['warn', { after: true, before: true }],
    '@stylistic/lines-around-comment': 0,
    '@stylistic/lines-between-class-members': ['warn', 'always'],
    // 200 is already generous. Explicitly allow unbroken cases where wrapping hurts more:
    // - Payload `{ de, en }` field copy (ignorePattern)
    // - SQL / similar long templates (ignoreTemplateLiterals)
    // - SVG path `d="…"` attributes (ignorePattern)
    '@stylistic/max-len': ['warn', 200, {
        ignoreComments: true,
        ignoreTemplateLiterals: true,
        ignorePattern: String.raw`\b(de|en):\s*['"]|\bd=["']`,
    }],
    '@stylistic/max-statements-per-line': ['warn', { max: 2 }],
    // Align with Payload .d.ts / `semi: always` — semicolons in types, not commas.
    '@stylistic/member-delimiter-style': ['warn', {
        multiline: { delimiter: 'semi', requireLast: true },
        singleline: { delimiter: 'semi', requireLast: false }
    }],
    '@stylistic/multiline-ternary': 0,
    '@stylistic/multiline-comment-style': 0,
    '@stylistic/newline-per-chained-call': 0,
    '@stylistic/no-confusing-arrow': ['warn', { allowParens: true, onlyOneSimpleParam: true }],
    // ignoreJSX: jsx-wrap-multilines requires parens around multiline JSX; without this the
    // two rules fight (circular --fix). Also covers `cond && ( <Jsx/> )` wrappers.
    '@stylistic/no-extra-parens': ['warn', 'all', {
        conditionalAssign: false,
        ignoreJSX: 'all',
        ignoredNodes: ['ArrowFunctionExpression[body.type="ConditionalExpression"]']
    }],
    '@stylistic/no-extra-semi': 'warn',
    '@stylistic/no-floating-decimal': 'warn',
    '@stylistic/no-mixed-operators': 0,
    '@stylistic/no-mixed-spaces-and-tabs': ['warn', 'smart-tabs'],
    '@stylistic/no-multi-spaces': 'warn',
    '@stylistic/no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 0, maxBOF: 0 }],
    '@stylistic/no-tabs': 'warn',
    '@stylistic/no-trailing-spaces': 'warn',
    '@stylistic/nonblock-statement-body-position': 'warn',
    '@stylistic/object-curly-spacing': ['warn', 'always', { arraysInObjects: true }],
    '@stylistic/object-property-newline': ['warn', { allowAllPropertiesOnSameLine: true }],
    '@stylistic/one-var-declaration-per-line': ['warn', 'initializations'],
    '@stylistic/operator-linebreak': ['warn', 'before'],
    '@stylistic/padding-line-between-statements': ['warn', { blankLine: 'always', prev: 'directive', next: 'directive' }],
    '@stylistic/quote-props': ['warn', 'as-needed'],
    '@stylistic/quotes': ['warn', 'single', { avoidEscape: true }],
    '@stylistic/padded-blocks': 0,
    '@stylistic/rest-spread-spacing': 'warn',
    '@stylistic/semi': ['error', 'always'],
    '@stylistic/semi-spacing': ['error', { before: false, after: true }],
    '@stylistic/semi-style': ['error', 'last'],
    '@stylistic/space-before-blocks': 'warn',
    '@stylistic/space-before-function-paren': ['warn', { 'anonymous': 'never', 'named': 'never', 'asyncArrow': 'never', 'catch': 'always' }],
    '@stylistic/space-in-parens': ['warn', 'never'],
    '@stylistic/space-infix-ops': 'warn',
    '@stylistic/space-unary-ops': 'warn',
    '@stylistic/spaced-comment': ['warn', 'always', { block: { balanced: true }, line: { exceptions: ['>>excludeStart("devOnly", pragmas.devOnly);', '>>excludeEnd("devOnly");'] } }],
    '@stylistic/switch-colon-spacing': 'warn',
    '@stylistic/template-curly-spacing': 'warn',
    '@stylistic/template-tag-spacing': ['warn', 'always'],
    '@stylistic/wrap-iife': 'warn',
    '@stylistic/yield-star-spacing': 'warn',

    // JSDoc (check-only)
    'jsdoc/check-access': 'warn',
    'jsdoc/check-alignment': 'warn',
    'jsdoc/check-examples': 0,
    'jsdoc/check-indentation': 'warn',
    'jsdoc/check-line-alignment': ['warn', 'always', { customSpacings: { postDelimiter: 1, postTag: 1, postType: 1, postName: 2 }, tags: ['param', 'arg', 'argument', 'property', 'prop', 'returns', 'type', 'module', 'requires', 'augments', 'throws'] }],
    'jsdoc/check-param-names': 'warn',
    'jsdoc/check-template-names': 'warn',
    'jsdoc/check-property-names': 'warn',
    'jsdoc/check-syntax': 'warn',
    'jsdoc/check-tag-names': 'warn',
    'jsdoc/check-types': 'warn',
    'jsdoc/check-values': 'warn',
    'jsdoc/empty-tags': 'warn',
    'jsdoc/implements-on-classes': 'warn',
    'jsdoc/informative-docs': 'warn',
    'jsdoc/match-description': 'warn',
    'jsdoc/multiline-blocks': 'warn',
    'jsdoc/no-bad-blocks': 'warn',
    'jsdoc/no-blank-block-descriptions': 'warn',
    'jsdoc/no-defaults': 0,
    'jsdoc/no-missing-syntax': 0,
    'jsdoc/no-multi-asterisks': 'warn',
    'jsdoc/no-restricted-syntax': 0,
    'jsdoc/no-types': 0,
    'jsdoc/no-undefined-types': 'warn',
    'jsdoc/require-asterisk-prefix': 'warn',
    'jsdoc/require-description': 'warn',
    'jsdoc/require-description-complete-sentence': 'warn',
    'jsdoc/require-example': 0,
    'jsdoc/require-file-overview': 0,
    'jsdoc/require-hyphen-before-param-description': ['warn', 'never'],
    'jsdoc/require-param': 'warn',
    'jsdoc/require-param-description': 'warn',
    'jsdoc/require-param-name': 'warn',
    'jsdoc/require-param-type': 'warn',
    'jsdoc/require-property': 'warn',
    'jsdoc/require-property-description': 'warn',
    'jsdoc/require-property-name': 'warn',
    'jsdoc/require-property-type': 'warn',
    'jsdoc/require-returns': ['warn', { forceReturnsWithAsync: false }],
    'jsdoc/require-returns-check': 'warn',
    'jsdoc/require-returns-description': 'warn',
    'jsdoc/require-returns-type': 'warn',
    'jsdoc/require-template': 'warn',
    'jsdoc/require-throws': 'warn',
    'jsdoc/require-yields': 'warn',
    'jsdoc/require-yields-check': 'warn',
    'jsdoc/sort-tags': ['warn', { tagSequence: [{ tags: [
        'summary', 'typeSummary', 'module', 'exports', 'file', 'fileoverview', 'overview', 'import',
        'static', 'private', 'protected', 'public', 'access', 'package', '-other',
        'const', 'constant', 'final', 'global', 'readonly', 'abstract', 'virtual', 'var', 'member', 'memberof', 'memberof!', 'inner', 'instance', 'inheritdoc', 'inheritDoc', 'override', 'hideconstructor',
        'event', 'typedef', 'interface', 'record', 'template', 'name', 'kind', 'type', 'alias', 'external', 'host', 'callback', 'func', 'function', 'method', 'class', 'constructor',
        'modifies', 'mixes', 'mixin', 'mixinClass', 'mixinFunction', 'namespace', 'borrows', 'constructs', 'lends', 'implements', 'requires',
        'param', 'arg', 'argument', 'prop', 'property', 'return', 'returns',
        'async', 'generator', 'default', 'defaultvalue', 'enum', 'augments', 'extends', 'throws', 'exception', 'yield', 'yields', 'fires', 'emits', 'listens', 'this',
        'ignore', 'author', 'version', 'variation', 'since', 'deprecated', 'todo',
        'desc', 'description', 'classdesc', 'tutorial', 'copyright', 'license',
        'see', 'example'
    ] }] }],
    'jsdoc/tag-lines': 'warn',
    'jsdoc/valid-types': 'warn'
};

// typescript-eslint must come after this, so its overrides of core rules win.
const base = [
    js.configs.recommended,
    stylistic.configs.recommended,
    {
        plugins: { '@stylistic': stylistic, jsdoc },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.nodeBuiltin, ...globals.browser }
        },
        settings: { jsdoc: tsdocSettings },
        rules: { ...commonRules }
    }
];

export default defineConfig([
    globalIgnores(['dist/**']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [base, ...tseslint.configs.recommendedTypeChecked],
        plugins: { 'react-hooks': reactHooks },
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            ...tsdocRules,
            ...typeAwareTsRules,
            ...reactHooksRules,
            '@stylistic/jsx-indent-props': ['warn', 4],
            '@stylistic/jsx-closing-bracket-location': ['warn', 'tag-aligned'],
        }
    },
]);
