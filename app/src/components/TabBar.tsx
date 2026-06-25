import { motion } from 'framer-motion';
import { TabType } from '../types/task';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { key: TabType; label: string }[] = [
  { key: 'today', label: '当天' },
  { key: 'all', label: '全部' },
  { key: 'completed', label: '复盘' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="tabbar flex gap-1 bg-transparent px-3 py-1.5 backdrop-blur-sm">
      {tabs.map((tab) => (
        <motion.button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`relative rounded-lg px-3 py-1.5 font-sans text-[0.84rem] transition-colors ${
            activeTab === tab.key
              ? 'bg-white/50 font-semibold text-black dark:bg-white/10 dark:text-white'
              : 'text-black hover:text-black dark:text-white dark:hover:text-white'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {tab.label}
          {activeTab === tab.key && (
            <motion.div
              layoutId="activeTab"
              className="tabbar-active-indicator absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-forest dark:bg-gold"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
