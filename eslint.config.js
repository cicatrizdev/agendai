import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import { agendaiPlugin } from "./packages/eslint-rules/src/index.ts";

export default defineConfig(
  {
    ignores: ["**/node_modules/**", "**/dist/**", "evals/tasks/**", "evals/cassettes/**", "supabase/**"],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}", "apps/ops-console/**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // The product's service key bypasses RLS: only one-off scripts may touch it.
    files: ["**/*.{ts,tsx,js}"],
    ignores: ["scripts/**", "packages/eslint-rules/**"],
    plugins: { agendai: agendaiPlugin },
    rules: {
      "agendai/no-service-key-outside-scripts": "error",
    },
  },
);
