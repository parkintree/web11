import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * V4.0：在 W10 的 Vite 工程上加 React 插件。
 *
 * · plugins: [react()] —— 提供 JSX 编译与 Fast Refresh；
 * · base: './' —— dist 产物可部署在任意子路径；
 * · target: 'es2020' —— 与 W9 起的浏览器基线保持一致；
 * · 类型检查仍交给 npm run build 的 tsc --noEmit，不在 Vite 内部做。
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'es2020',
    assetsInlineLimit: 4096,
  },
});
