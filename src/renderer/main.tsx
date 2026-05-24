/**
 * React 应用入口文件
 * 
 * 这是 React 渲染进程的入口点
 * 负责挂载 React 应用到 DOM 中
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 获取根 DOM 节点
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// 创建 React 根并渲染应用
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
