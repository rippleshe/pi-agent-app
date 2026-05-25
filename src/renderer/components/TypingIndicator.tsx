/**
 * 打字指示器组件
 *
 * AI 正在处理但还没有输出时，显示三个跳跃的小圆点动画。
 *
 * 【Framer Motion 数组动画】
 * animate={{ y: [0, -6, 0] }} 表示：
 * - 从 y=0 开始
 * - 移动到 y=-6（向上 6px）
 * - 回到 y=0
 * - 无限循环（repeat: Infinity）
 *
 * delay: i * 0.2 让三个圆点错开启动时间，形成波浪效果。
 */

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3"
    >
      {/* AI 头像 */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>

      {/* 跳跃动画的三个圆点 */}
      <div className="bg-surface rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-border/50">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-text-muted"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 1.4,      // 一次弹跳的时长
                repeat: Infinity,    // 无限循环
                delay: i * 0.2,      // 每个圆点延迟 0.2 秒，形成波浪
                ease: 'easeInOut',   // 缓动：慢-快-慢
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
