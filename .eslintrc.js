module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
  },
  plugins: [
    "@typescript-eslint",
    "react-hooks",
  ],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": ["warn", {
      additionalHooks: "useAsync|useAsyncCb|useListen",
    }],
  },
  extends: [
    "plugin:@typescript-eslint/eslint-recommended"
  ]
};
