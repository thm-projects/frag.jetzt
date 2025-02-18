import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "projects/**/*",
        "src/assets/i18n/**/*",
        "src/assets/theme-m3/**/*",
        "src/modules/**/*",
        "cypress/**/*",
        "install/**/*",
    ],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@angular-eslint/recommended",
    "plugin:@angular-eslint/template/process-inline-templates",
    "prettier",
).map(config => ({
    ...config,
    files: ["**/*.ts"],
})), {
    files: ["**/*.ts"],

    languageOptions: {
        ecmaVersion: 5,
        sourceType: "script",

        parserOptions: {
            project: ["tsconfig.json"],
            createDefaultProgram: true,
        },
    },

    rules: {
        "@angular-eslint/component-selector": ["error", {
            type: "element",
            prefix: "app",
            style: "kebab-case",
        }],

        "@angular-eslint/directive-selector": ["error", {
            type: "attribute",
            prefix: "app",
            style: "camelCase",
        }],

        "@angular-eslint/prefer-standalone": "off",

        "@typescript-eslint/consistent-type-definitions": "error",
        "@typescript-eslint/dot-notation": "off",

        "@typescript-eslint/explicit-member-accessibility": ["off", {
            accessibility: "explicit",
        }],

        "@typescript-eslint/naming-convention": ["error", {
            format: ["UPPER_CASE", "StrictPascalCase"],
            selector: ["enumMember"],
        }],

        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-shadow": "off",
        "arrow-body-style": ["off", "as-needed"],
        "brace-style": ["error", "1tbs"],
        "id-blacklist": "off",
        "id-match": "off",
        "no-bitwise": "off",
        "no-underscore-dangle": "off",
    },
}, ...compat.extends("plugin:@angular-eslint/template/recommended", "prettier").map(config => ({
    ...config,
    files: ["**/*.html"],
}))];
