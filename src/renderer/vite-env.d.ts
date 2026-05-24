/**
 * CSS 模块类型声明
 * 允许导入 CSS 文件而不报 TypeScript 错误
 */

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
