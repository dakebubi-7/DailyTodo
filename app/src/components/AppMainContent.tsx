import { lazy, Suspense, type ComponentProps, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AddTaskInput } from './AddTaskInput';
import type { ReviewView as ReviewViewComponent } from './ReviewView';
import { TaskList } from './TaskList';

const ReviewView = lazy(() => import('./ReviewView').then((module) => ({ default: module.ReviewView })));

export interface AppMainContentProps {
  mainScrollRef: ComponentProps<'div'>['ref'];
  topContent: ReactNode;
  isReviewTab: boolean;
  reviewViewProps: ComponentProps<typeof ReviewViewComponent>;
  taskListProps: ComponentProps<typeof TaskList>;
  addTaskInputProps: ComponentProps<typeof AddTaskInput>;
}

export function AppMainContent({
  mainScrollRef,
  topContent,
  isReviewTab,
  reviewViewProps,
  taskListProps,
  addTaskInputProps,
}: AppMainContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div ref={mainScrollRef} className="app-main-scroll min-h-0 flex flex-1 flex-col overflow-hidden">
        {topContent}
        {isReviewTab ? (
          <Suspense fallback={null}>
            <ReviewView {...reviewViewProps} />
          </Suspense>
        ) : (
          <TaskList {...taskListProps} />
        )}
      </div>

      <AddTaskInput {...addTaskInputProps} />
    </motion.div>
  );
}
