import { motion } from 'framer-motion';

export function TaskListEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="empty-state"
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" className="mb-3 opacity-45">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="font-sans text-sm">{'\u8fd9\u4e00\u5929\u8fd8\u6ca1\u6709\u4efb\u52a1'}</p>
      <p className="mt-1 font-sans text-xs">{'\u5199\u4e0b\u7b2c\u4e00\u4ef6\u8981\u63a8\u8fdb\u7684\u5c0f\u4e8b'}</p>
    </motion.div>
  );
}
