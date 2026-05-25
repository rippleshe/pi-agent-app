/**
 * React 应用入口文件
 *
 * 【这是整个前端的"起点"】
 * 当 Electron 加载 index.html 时，浏览器会执行这个文件。
 * 它做了唯一一件事：把 React 组件树挂载到 HTML 中的 <div id="root"> 上。
 *
 * 【为什么是 .tsx 而不是 .ts？】
 * .tsx = TypeScript + JSX
 * JSX 是 JavaScript 的语法扩展，让你在 JS 里写类似 HTML 的标签：
 *   const element = <h1>Hello</h1>;
 * 只要文件里有 JSX 语法，就必须用 .tsx 后缀名。
 *
 * 【React 的核心思想】
 * React 把 UI 拆成一棵"组件树"。每个组件是一个函数，返回一段 JSX。
 * 这个文件就是把树的根节点（App）挂到 DOM 上。
 */

// React 核心库
import React from 'react';
// ReactDOM 负责把 React 组件渲染到浏览器 DOM 中
import ReactDOM from 'react-dom/client';
// 我们自己写的根组件
import App from './App';
// 全局 CSS 样式
import './index.css';

// ── 获取挂载点 ─────────────────────────────────────────────────────
// document.getElementById 是浏览器原生 API，通过 ID 查找 DOM 元素
// index.html 里有 <div id="root"></div>，React 组件树会被插入到这个 div 里
const rootElement = document.getElementById('root');

// 【防御性编程】如果找不到 root 元素，说明 index.html 有问题，提前报错
// throw 会抛出异常，终止程序执行
if (!rootElement) {
  throw new Error('Root element not found');
}

// ── 挂载 React 应用 ────────────────────────────────────────────────
// createRoot 是 React 18+ 的 API（旧版用 render）
// 它创建一个"根"，后续所有 React 组件都是它的子孙
const root = ReactDOM.createRoot(rootElement);

// render 方法把 JSX 渲染到 root 中
// 【StrictMode 是什么？】
// 开发模式下的辅助工具，会在控制台额外打印：
// - 废弃的 API 用法警告
// - 潜在的副作用问题
// - 不安全的生命周期方法
// 它只在开发环境生效，生产构建会自动移除，不影响性能。
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
