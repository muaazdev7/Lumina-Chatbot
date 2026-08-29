import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./tests/setup.js'],
        // The in-memory replica set takes a while to start, and each test file
        // gets its own instance.
        testTimeout: 30000,
        hookTimeout: 120000,
        fileParallelism: false,
    },
})
