interface StopPropagationEvent {
  stopPropagation: () => void;
}

export function stopClusterToggle(event: StopPropagationEvent) {
  event.stopPropagation();
}

export function shouldToggleTaskClusterForKey(key: string) {
  return key === 'Enter' || key === ' ';
}
