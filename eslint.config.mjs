import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/app/components/shared/page-not-found/page-not-found.component.spec.ts"
    ]
  },
);