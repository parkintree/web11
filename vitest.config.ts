import { defineConfig } from 'vitest/config';

/**
 * 单测只覆盖纯函数数据层（todo-core.ts），环境保持 node。
 * React 组件的行为验证走真实浏览器（scripts/ui-verify.mjs），
 * 不在单测里模拟 DOM。
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
  },
});
