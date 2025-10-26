module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
  ],
  rules: {
    "quotes": ["error", "double"],
    "indent": ["error", 2],
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
  },
};
