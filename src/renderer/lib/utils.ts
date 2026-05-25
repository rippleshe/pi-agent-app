/**
 * 工具函数库
 *
 * 【为什么需要 cn() 这个函数？】
 * Tailwind CSS 的类名是字符串，比如 "px-4 py-2 bg-blue-500"。
 * 有时候我们需要根据条件动态拼接类名：
 *   - 普通状态：px-4 py-2
 *   - 激活状态：px-4 py-2 bg-blue-500 text-white
 *
 * 直接拼字符串会遇到两个问题：
 * 1. Tailwind 的类可能冲突（比如 bg-red-500 和 bg-blue-500 同时存在，
 *    浏览器只认后出现的那个）
 * 2. 条件拼接写起来很丑：`px-4 ${isActive ? 'bg-blue' : ''} ${hasError ? 'bg-red' : ''}`
 *
 * cn() 解决了这两个问题：
 * - clsx: 处理条件拼接（自动过滤 falsy 值：false、null、undefined、空字符串）
 * - tailwind-merge: 智能合并冲突的 Tailwind 类（bg-red 和 bg-blue 只保留后一个）
 *
 * 【示例】
 * cn('px-4', 'py-2', { 'bg-red-500': hasError, 'bg-blue-500': !hasError })
 * 如果 hasError = true，结果是 "px-4 py-2 bg-red-500"
 * 如果 hasError = false，结果是 "px-4 py-2 bg-blue-500"
 *
 * cn('bg-red-500', 'bg-blue-500')
 * 结果是 "bg-blue-500"（后者覆盖前者，而不是两个都保留）
 */

// 【导入类型】
// type 关键字表示只导入类型信息，不会打包到最终代码中
// ClassValue 是 clsx 接受的参数类型
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 CSS 类名
 *
 * 【展开运算符 (...inputs)】
 * ...inputs 是"剩余参数"语法，把所有传入的参数收集成一个数组。
 * 你可以传任意多个参数：cn('a', 'b', 'c')，inputs 就是 ['a', 'b', 'c']
 *
 * 【返回值类型】
 * string —— 最终合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]): string {
  // clsx 先把各种格式（字符串、对象、数组）统一成一个字符串
  // twMerge 再处理 Tailwind 类的冲突合并
  return twMerge(clsx(inputs));
}
