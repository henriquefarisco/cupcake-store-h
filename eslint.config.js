import ts from "typescript-eslint";
export default ts.config(
  { ignores: ["dist/**", "node_modules/**", ".local/**"] },
  ...ts.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  },
);
