import { useEffect, useMemo, useRef, useState } from 'react';
import './styles/index.css';
import { createAppViewportStyle } from './app/appViewportStyle';
import { createAppThemeState } from './app/appThemeState';
import { getAppShellClassName, getAppShellLowOpacityFlag, getAppShellThemeValue, getAppViewportClassName } from './app/appShellPresentation';
import { useAppLocalState } from './app/useAppLocalState';
import { useAppRuntimeEffects } from './app/useAppRuntimeEffects';
import { useAppShellComposition } from './app/useAppShellComposition';
import { useTasks } from './hooks/useTasks';
import { TitleBar } from './components/TitleBar';
import { AppOverlayStack } from './components/AppOverlayStack';
import { AppMainContent } from './components/AppMainContent';
import { getPerformanceFrostShellAttributes } from './app/appShellEffects';

export default function App() {
  const taskState = useTasks();
  const appState = useAppLocalState();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const [performanceFrostActive, setPerformanceFrostActive] = useState(false);
  const themeState = useMemo(() => createAppThemeState(appState.personalization), [appState.personalization]);
  const viewportStyle = useMemo(() => createAppViewportStyle(appState.personalization, themeState.isInvisibleTheme), [appState.personalization, themeState.isInvisibleTheme]);

  useAppRuntimeEffects({
    appState,
    taskEffects: {
      allTasks: taskState.allTasks,
      isLoaded: taskState.isLoaded,
      isDark: taskState.isDark,
      setDarkMode: taskState.setDarkMode,
      openSelectedDailyNote: taskState.openSelectedDailyNote,
      setSelectedDate: taskState.setSelectedDate,
      addSubtask: taskState.addSubtask,
      deleteTask: taskState.deleteTask,
      updateTask: taskState.updateTask,
    },
    mainScrollRef,
    activeThemeId: themeState.activeThemeId,
  });

  const shellComposition = useAppShellComposition({
    appState,
    taskState,
    themeState,
    mainScrollRef,
  });

  useEffect(() => window.electronAPI?.onPerformanceFrostChanged(setPerformanceFrostActive), []);

  return (
    <div
      className={getAppViewportClassName(taskState.isLoaded)}
      style={viewportStyle}
    >
      <div
        className={getAppShellClassName({
          themeClass: themeState.themeClass,
          layoutDensity: appState.personalization.layoutDensity,
          texture: appState.personalization.texture,
          animations: appState.personalization.animations,
          compactMode: appState.compactMode,
        })}
        style={viewportStyle}
        data-theme={getAppShellThemeValue(themeState.activeThemeId)}
        data-low-opacity={getAppShellLowOpacityFlag(themeState.isInvisibleTheme, appState.personalization.windowOpacity)}
        {...getPerformanceFrostShellAttributes(performanceFrostActive)}
      >
        <div
          className="flex min-h-0 flex-1 flex-col"
          inert={shellComposition.overlayStackProps.isTaskDialogOpen ? '' : undefined}
          aria-hidden={shellComposition.overlayStackProps.isTaskDialogOpen || undefined}
        >
          <TitleBar {...shellComposition.titleBarProps} />
          <AppMainContent {...shellComposition.mainContentProps} />
        </div>
        <AppOverlayStack {...shellComposition.overlayStackProps} />
      </div>
    </div>
  );
}
