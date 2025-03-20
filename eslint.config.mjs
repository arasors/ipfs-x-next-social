import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['next', 'next/typescript'],
    rules: {
        "turbo/no-undeclared-env-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "no-unused-vars": "off",
        "react/no-unescaped-entities": "off",
        "@next/next/no-img-element": "off",
        "jsx-a11y/alt-text": "off",
        "react-hooks/exhaustive-deps": "off",
        "@typescript-eslint/no-empty-object-type": "off",
        "react-hooks/rules-of-hooks": "off"
    }
  }),
]

export default eslintConfig