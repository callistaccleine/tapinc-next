import { useEffect, type DependencyList } from "react";

/**
 * Simple debounce for effects; waits `waitTime` before invoking `fn`
 * and clears on cleanup. Dependencies default to empty array.
 */
export function useDebounceEffect(fn: () => void, waitTime: number, deps?: DependencyList) {
  useEffect(() => {
    const timer = setTimeout(() => {
      fn();
    }, waitTime);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? []);
}
