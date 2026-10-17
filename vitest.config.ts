import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [{
        name: 'stub-css',
        enforce: 'pre',
        load(id) {
            if (id.endsWith('.css')) return 'export default {}';
        },
    }],
    test: {
        environment: 'node',
        include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
        server: {
            deps: {
                inline: [/@payloadcms\//, /react-image-crop/],
            },
        },
    },
});
