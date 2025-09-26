module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
  ],
  plugins: [
    'testing-library',
  ],
  overrides: [
    // Test files configuration
    {
      files: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
        'setup-test.ts',
        'test-utils/**/*.[jt]s?(x)',
      ],
      extends: [
        'plugin:testing-library/react',
      ],
      rules: {
        // Enforce test coverage practices
        'testing-library/prefer-screen-queries': 'error',
        'testing-library/no-debugging-utils': 'warn',
        'testing-library/no-dom-import': 'error',
        'testing-library/prefer-user-event': 'error',
        'testing-library/no-wait-for-multiple-assertions': 'error',
        'testing-library/no-wait-for-side-effects': 'error',
        'testing-library/prefer-find-by': 'error',
        
        // Allow console in tests for debugging
        'no-console': 'off',
        
        // Allow any for mocks and test utilities
        '@typescript-eslint/no-explicit-any': 'off',
        
        // Allow non-null assertions in tests
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    // Mock files configuration
    {
      files: ['**/__mocks__/**/*.[jt]s?(x)'],
      rules: {
        // Allow any and explicit returns in mocks
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'import/no-anonymous-default-export': 'off',
      },
    },
  ],
  rules: {
    // General code quality rules that help with testability
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'off', // Handled by TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    
    // Encourage explicit return types for better testability
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    
    // Prevent common testing pitfalls
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  settings: {
    'testing-library/custom-renders': ['render'],
    'testing-library/utils-module': 'test-utils',
  },
};