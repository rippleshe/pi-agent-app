import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
      <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[9px] font-bold text-white">AI</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex gap-1.5 items-center h-[20px]">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
