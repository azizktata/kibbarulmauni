"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useOptimistic,
  useTransition,
  type ReactNode,
} from "react";

type WatchedContextValue = {
  isLoaded: boolean;
  isLoggedIn: boolean;
  isWatched: (key: string) => boolean;
  toggleWatched: (key: string) => void;
  watchedKeys: ReadonlySet<string>;
};

const WatchedContext = createContext<WatchedContextValue | null>(null);

export function WatchedProvider({
  children,
  isLoggedIn,
}: {
  children: ReactNode;
  isLoggedIn: boolean;
}) {
  const [serverKeys, setServerKeys] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [optimisticKeys, applyOptimistic] = useOptimistic(
    serverKeys,
    (
      current: Set<string>,
      action: { key: string; watched: boolean }
    ) => {
      const next = new Set(current);
      if (action.watched) next.add(action.key);
      else next.delete(action.key);
      return next;
    }
  );
  const [, startTransition] = useTransition();

  // Stable ref so toggleWatched doesn't need optimisticKeys in its dep array
  const optimisticKeysRef = useRef(optimisticKeys);
  useEffect(() => { optimisticKeysRef.current = optimisticKeys; }, [optimisticKeys]);

  const fetchKeys = useCallback(async () => {
    try {
      const data = (await fetch("/api/progress").then((r) => r.json())) as {
        keys: string[];
      };
      setServerKeys(new Set(data.keys));
    } catch (err) {
      console.error("[watchedContext] fetchKeys failed:", err);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoaded(true);
      return;
    }
    fetchKeys().then(() => setIsLoaded(true));
  }, [isLoggedIn, fetchKeys]);

  const toggleWatched = useCallback(
    (key: string) => {
      if (!isLoggedIn) return;
      const willBeWatched = !optimisticKeysRef.current.has(key);
      startTransition(async () => {
        applyOptimistic({ key, watched: willBeWatched });
        await fetch("/api/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonKey: key, watched: willBeWatched }),
        });
        await fetchKeys();
      });
    },
    [isLoggedIn, applyOptimistic, fetchKeys]
  );

  const isWatched = useCallback(
    (key: string) => optimisticKeys.has(key),
    [optimisticKeys]
  );

  return (
    <WatchedContext.Provider
      value={{ isLoaded, isLoggedIn, isWatched, toggleWatched, watchedKeys: optimisticKeys }}
    >
      {children}
    </WatchedContext.Provider>
  );
}

export function useWatched(): WatchedContextValue {
  const ctx = useContext(WatchedContext);
  if (!ctx) throw new Error("useWatched must be inside WatchedProvider");
  return ctx;
}
