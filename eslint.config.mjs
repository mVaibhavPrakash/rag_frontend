import { defineConfig } from "eslint/config";
import reactPlugin from "eslint-plugin-react";
import tsParser from "@typescript-eslint/parser";

const eslintConfig = defineConfig([
    {
        ignores: ["dist/**", "node_modules/**"],
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsParser,
        },
        plugins: { react: reactPlugin },
        rules: {
            semi: ["error", "always"],
            "react/jsx-uses-react": "error",
            "react/jsx-uses-vars": "error",
        },
    },
]);

export default eslintConfig;
