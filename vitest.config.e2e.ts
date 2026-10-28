import { defineConfig, mergeConfig } from 'vitest/config';
import unitConfig from './vitest.config.js';

export default mergeConfig(
  unitConfig,
  defineConfig({
    test: {
      include: ['test/**/*.e2e-spec.ts'],
      globals: true,
      testTimeout: 15_000,
      hookTimeout: 15_000,
      fileParallelism: false,
    },
  }),
);
