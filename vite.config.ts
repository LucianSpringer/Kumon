import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@types': resolve(__dirname, 'src/@types'),
            '@core': resolve(__dirname, 'src/core'),
            '@hooks': resolve(__dirname, 'src/hooks'),
            '@components': resolve(__dirname, 'src/components'),
            '@physics': resolve(__dirname, 'src/physics'),
            '@state': resolve(__dirname, 'src/state'),
        },
    },
    server: {
        port: 3000,
        open: true,
    },
});
