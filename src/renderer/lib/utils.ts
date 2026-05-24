/**
 * 工具函数：合并 CSS 类名
 * 用于条件性地添加 Tailwind CSS 类
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并类名，智能处理 Tailwind 冲突类
 * @param inputs - 任意数量的类名或类名对象
 * @returns 合并后的类名字符串
 * 
 * @example
 * cn('px-2', 'py-1', { 'bg-red': isError })
 * // => "px-2 py-1 bg-red"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
