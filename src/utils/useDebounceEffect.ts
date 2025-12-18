import { useEffect, type DependencyList } from "react";

export function useDebounceEffect(fn: () => void, waitTime: number, deps?: DependencyList) {
  useEffect(() => {
    const timer = setTimeout(() => {
      fn();
    }, waitTime);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
