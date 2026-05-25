import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 max-w-3xl">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/70 to-primary-dark/70 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-3 h-3 text-white" />
      </div>
      <div className="bg-surface rounded-2xl rounded-tl-md px-4 py-3 shadow-xs border border-border/30">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-text-muted/40"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
