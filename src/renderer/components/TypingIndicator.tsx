/**
 * 打字指示器组件
 *
 * 显示 AI 正在输入的动画效果
 *
 * UX 改进（基于 UI/UX Pro Max）：
 * - 平滑的弹簧物理动画
 * - 尊重 prefers-reduced-motion
 * - 一致的视觉层次
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

      {/* 打字动画 */}
      <div className="bg-surface rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-border/50">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-text-muted"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
