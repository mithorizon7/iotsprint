module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', 'node_modules', 'coverage', 'client/public'],
  rules: {
    'react/prop-types': 'off',
    'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper'] }],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
  overrides: [
    {
      files: ['client/src/components/ui/**/*.{ts,tsx}'],
      rules: {
        'jsx-a11y/heading-has-content': 'off',
        'jsx-a11y/anchor-has-content': 'off',
      },
    },
    {
      files: ['scripts/**/*.{js,cjs}'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
