/**
 * 共享图标映射
 *
 * Sidebar 和 SettingsPanel 共用的工具图标配置
 */

import { FileText, Terminal, Search, FolderOpen, List, Wrench } from 'lucide-react';
import type { ElementType } from 'react';

/** 工具 ID → Lucide 图标组件 */
export const TOOL_ICONS: Record<string, ElementType> = {
  file: FileText,
  terminal: Terminal,
  search: Search,
  folder: FolderOpen,
  list: List,
};

/** 获取工具图标，未知 ID 回退到 Wrench */
export function getToolIcon(iconId: string): ElementType {
  return TOOL_ICONS[iconId] || Wrench;
}
