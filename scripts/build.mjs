import { build } from 'esbuild';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const shared = {
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    packages: 'external',
    jsx: 'automatic',
};

await mkdir('dist', { recursive: true });

await build({
    ...shared,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
});

await build({
    ...shared,
    entryPoints: ['src/client.tsx'],
    outfile: 'dist/client.js',
    external: ['./styles.css'],
});

await build({
    ...shared,
    entryPoints: ['src/rsc.tsx'],
    outfile: 'dist/rsc.js',
});

await cp('src/styles.css', 'dist/styles.css');
// `client.d.ts` keeps `import './styles.css'`. Consumers with `noUncheckedSideEffectImports` and no `skipLibCheck` need a declaration for it.
await writeFile('dist/styles.css.d.ts', 'export {};\n');

const tsc = spawnSync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
if (tsc.status !== 0) process.exit(tsc.status ?? 1);
