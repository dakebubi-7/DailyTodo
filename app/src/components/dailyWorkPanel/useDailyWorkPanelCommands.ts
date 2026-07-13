import { useState, type KeyboardEvent } from 'react';
import { shouldOpenDailyCommandMenu } from '../../utils/dailyCommandEditor';

interface CommandKeyDownResult {
  handled: boolean;
  commandIndex?: number;
}

export function useDailyWorkPanelCommands(taskCommandCount: number) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);

  const closeCommandMenu = () => {
    setCommandOpen(false);
    setCommandIndex(0);
  };

  const handleCommandTextChange = (value: string, cursor: number) => {
    const open = shouldOpenDailyCommandMenu(value, cursor);
    setCommandOpen(open);
    if (open) setCommandIndex(0);
  };

  const handleCommandKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ): CommandKeyDownResult => {
    if (event.key === 'Escape') {
      closeCommandMenu();
      return { handled: true };
    }

    if (commandOpen && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      event.stopPropagation();
      const count = taskCommandCount || 1;
      setCommandIndex((previous) =>
        event.key === 'ArrowDown' ? (previous + 1) % count : (previous - 1 + count) % count,
      );
      return { handled: true };
    }

    if (commandOpen && event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      return { handled: true, commandIndex };
    }

    return { handled: false };
  };

  return {
    commandOpen,
    commandIndex,
    closeCommandMenu,
    handleCommandTextChange,
    handleCommandKeyDown,
    setCommandIndex,
  };
}
