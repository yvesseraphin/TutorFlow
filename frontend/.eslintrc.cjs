module.exports = {
  env: { browser: true, es2022: true },
  extends: ["eslint:recommended", "plugin:react/recommended", "plugin:react-hooks/recommended"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
  plugins: ["react", "react-hooks"],
  settings: { react: { version: "detect" } },
  ignorePatterns: ["dist/"],
  rules: {
    "no-unused-vars": "off",
    "no-unreachable": "off",
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
    "react-hooks/exhaustive-deps": "off",
  },
};
