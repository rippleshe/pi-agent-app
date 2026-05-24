import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/**
 * Vite 配置文件
 * 用于构建和开发 React 渲染进程
 */
export default defineConfig({
  // 使用 React 插件
  plugins: [react(), tailwindcss()],

  // 配置路径别名，方便导入
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },

  // 指定根目录为 renderer 目录
  root: path.resolve(__dirname, 'src/renderer'),

  // 公共目录
  publicDir: path.resolve(__dirname, 'src/renderer/public'),

  // Electron 需要的基础配置
  base: './',

  // 构建输出配置
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
});
