// @ts-check
import { readdirSync } from 'node:fs';
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// --- Fronteras entre bounded contexts (AGENTS.md 3.3 y 4) ---
// Cada carpeta de src/contexts es un contexto. Desde afuera solo se puede
// importar su API publica (contexts/<ctx>/index.ts u otros archivos en su
// raiz), nunca sus capas internas. Ademas, el dominio no importa de las
// otras capas ni de frameworks.
const LAYERS = 'domain|application|infrastructure|presentation';
const contexts = readdirSync(new URL('./src/contexts', import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const fueraDeContextos = {
  regex: `contexts/[^/]+/(${LAYERS})(/|$)`,
  message:
    'No importes capas internas de un contexto: usa su API publica (contexts/<ctx>).',
};

// Desde dentro del contexto `ctx`, una ruta relativa que sube y entra a las
// capas de otro contexto (ej. ../../usuarios/domain/x). shared/ es el kernel
// compartido y se puede importar.
const haciaOtroContexto = (ctx) => ({
  regex: `^(\\.\\./)+(?!(${ctx}|shared)/)[^./][^/]*/(${LAYERS})(/|$)`,
  message:
    'No importes capas internas de otro contexto: usa su API publica (../../<ctx>).',
});

const dominioPuro = [
  {
    regex: '(^|/)(application|infrastructure|presentation)(/|$)',
    message:
      'El dominio no importa de application, infrastructure ni presentation.',
  },
  {
    regex: '^(@nestjs/|typeorm$|express$)',
    message: 'El dominio no depende de frameworks (NestJS, TypeORM, Express).',
  },
];

const fronteras = [
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    ignores: ['src/contexts/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [fueraDeContextos] }],
    },
  },
  ...contexts.flatMap((ctx) => [
    {
      files: [`src/contexts/${ctx}/**/*.ts`],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [haciaOtroContexto(ctx)] },
        ],
      },
    },
    {
      // Va despues: en flat config gana el ultimo bloque, asi que repite la
      // regla de contexto y le suma la de dominio puro.
      files: [`src/contexts/${ctx}/domain/**/*.ts`],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [haciaOtroContexto(ctx), ...dominioPuro] },
        ],
      },
    },
  ]),
  {
    files: ['src/shared/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: dominioPuro }],
    },
  },
];

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Tests e2e de caja negra: el cuerpo de las respuestas HTTP es JSON sin
    // tipo, y tiparlo en cada assert solo agrega ruido.
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  ...fronteras,
);
