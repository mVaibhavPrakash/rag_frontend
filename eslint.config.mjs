import { defineConfig } from "eslint/config";
import reactPlugin from "eslint-plugin-react";

const eslintConfig = defineConfig([
    {
        plugins: { react: reactPlugin },
        rules: {
            semi: ["error", "always"],
            "react/jsx-uses-react": "error",
            "react/jsx-uses-vars": "error",
        },
        ignores: ["dist/**", "node_modules/**"],
    },
]);

export default eslintConfig;
