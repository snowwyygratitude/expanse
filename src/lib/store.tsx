"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Interaction, PlayRecord, Usefulness, UserProgress } from "./types";

const STORAGE_KEY = "aha:v2";

const initialState: UserProgress = {
  plays: {},
  savedInsightIds: [],
  completedLessonIds: [],
  interactionHistory: [],
  lessonFeedback: {},
  reportedExperiments: [],
  recentLessonIds: [],
};

function load(): UserProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...(JSON.parse(raw) as Partial<UserProgress>) };
  } catch {
    return initialState;
  }
}

interface AppContextValue {
  /** False until state has been read from localStorage. */
  hydrated: boolean;
  progress: UserProgress;
  /** Records a finished run of an experience and the outcome it reached. */
  recordPlay: (experienceId: string, outcome?: string, detail?: PlayRecord["detail"]) => void;
  toggleSavedInsight: (insightId: string) => void;
  visitLesson: (lessonId: string) => void;
  completeLesson: (lessonId: string) => void;
  recordInteraction: (interaction: Omit<Interaction, "at">) => void;
  setLessonFeedback: (lessonId: string, value: Usefulness) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export function AppProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    setProgress(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      /* storage unavailable: keep working in memory */
    }
  }, [progress, hydrated]);

  const update = useCallback((fn: (p: UserProgress) => UserProgress) => setProgress(fn), []);

  const actions = useMemo(
    () => ({
      recordPlay: (experienceId: string, outcome?: string, detail?: PlayRecord["detail"]) =>
        update((p) => {
          const prev = p.plays[experienceId] ?? { count: 0, lastAt: "", outcomes: [] };
          return {
            ...p,
            plays: {
              ...p.plays,
              [experienceId]: {
                count: prev.count + 1,
                lastAt: new Date().toISOString(),
                outcomes:
                  outcome && !prev.outcomes.includes(outcome) ? [...prev.outcomes, outcome] : prev.outcomes,
                detail: detail ?? prev.detail,
              },
            },
          };
        }),
      toggleSavedInsight: (id: string) =>
        update((p) => ({ ...p, savedInsightIds: toggle(p.savedInsightIds, id) })),
      visitLesson: (id: string) =>
        update((p) => ({
          ...p,
          recentLessonIds: [id, ...p.recentLessonIds.filter((x) => x !== id)].slice(0, 8),
        })),
      completeLesson: (id: string) =>
        update((p) =>
          p.completedLessonIds.includes(id)
            ? p
            : { ...p, completedLessonIds: [...p.completedLessonIds, id] },
        ),
      recordInteraction: (interaction: Omit<Interaction, "at">) =>
        update((p) => ({
          ...p,
          interactionHistory: [
            ...p.interactionHistory,
            { ...interaction, at: new Date().toISOString() },
          ].slice(-200),
        })),
      setLessonFeedback: (id: string, value: Usefulness) =>
        update((p) => ({ ...p, lessonFeedback: { ...p.lessonFeedback, [id]: value } })),
      reset: () => setProgress(initialState),
    }),
    [update],
  );

  const value = useMemo(() => ({ progress, hydrated, ...actions }), [progress, hydrated, actions]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
