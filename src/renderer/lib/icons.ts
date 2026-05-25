/**
 * 共享图标映射
 *
 * 【这个文件解决什么问题？】
 * Sidebar 和 SettingsPanel 都需要根据工具 ID 显示对应的图标。
 * 如果每个组件各写一份映射，改起来要改两处，容易遗漏。
 * 所以提取到这里，两个组件共用。
 *
 * 【Lucide React 是什么？】
 * 一个图标库，提供 1000+ 个 SVG 图标组件。
 * 用法：<FileText className="w-4 h-4" /> 就能显示一个文件图标。
 * 每个图标是一个 React 组件，接受 className 等 props。
 *
 * 【Record<string, ElementType> 是什么？】
 * Record 是 TypeScript 内置的工具类型，表示"一个对象，键是 string，值是 ElementType"。
 * 等价于 { [key: string]: ElementType }，但写起来更简洁。
 *
 * ElementType 是 React 的类型，表示"可以被渲染的东西"（组件、标签等）。
 */

import { FileText, Terminal, Search, FolderOpen, List, Wrench } from 'lucide-react';
import type { ElementType } from 'react';

/**
 * 工具 ID → 图标组件 的映射表
 *
 * 【为什么要映射？】
 * 数据层用的是字符串 'file'、'terminal' 等（存在 types.ts 的 DEFAULT_TOOLS 里）。
 * 但渲染层需要的是 React 组件（<FileText />、<Terminal />）。
 * 这个映射表就是"翻译器"：字符串 → 组件。
 */
export const TOOL_ICONS: Record<string, ElementType> = {
  file:     FileText,   // 读取文件 → 文件图标
  terminal: Terminal,   // 执行命令 → 终端图标
  search:   Search,     // 搜索代码 → 放大镜图标
  folder:   FolderOpen, // 查找文件 → 文件夹图标
  list:     List,       // 列出目录 → 列表图标
};

/**
 * 获取工具图标，未知 ID 回退到通用扳手图标
 *
 * 【防御性编程】
 * 如果将来加了新工具但忘了在 TOOL_ICONS 里加映射，
 * 不会报错，而是显示一个通用的扳手图标。
 * 比起让页面白屏崩溃，优雅降级是更好的选择。
 */
export function getToolIcon(iconId: string): ElementType {
  return TOOL_ICONS[iconId] || Wrench;
}
