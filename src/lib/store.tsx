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
import { lessonById } from "@/content";
import { nextIndex } from "./journey";
import type {
  Interaction,
  LearningJourney,
  Usefulness,
  UserProfile,
  UserProgress,
} from "./types";

const STORAGE_KEY = "aha:v1";

interface AppState {
  profile: UserProfile;
  journey: LearningJourney | null;
  progress: UserProgress;
}

const initialState: AppState = {
  profile: {
    selectedTopics: [],
    growthMotivation: null,
    personalGoal: "",
    onboardingCompleted: false,
  },
  journey: null,
  progress: {
    completedLessonIds: [],
    savedInsightIds: [],
    interactionHistory: [],
    lessonFeedback: {},
    reportedExperiments: [],
    recentLessonIds: [],
  },
};

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const saved = JSON.parse(raw) as Partial<AppState>;
    const known = (ids: unknown) =>
      Array.isArray(ids) ? ids.filter((id) => typeof id === "string" && lessonById[id]) : [];
    const progress = { ...initialState.progress, ...(saved.progress ?? {}) };
    // Drop anything that no longer exists in the catalog.
    progress.completedLessonIds = known(progress.completedLessonIds);
    progress.savedInsightIds = known(progress.savedInsightIds);
    progress.reportedExperiments = known(progress.reportedExperiments);
    progress.recentLessonIds = known(progress.recentLessonIds);
    let journey = saved.journey ?? null;
    if (journey && known(journey.lessonIds).length !== journey.lessonIds?.length) journey = null;
    return {
      profile: { ...initialState.profile, ...(saved.profile ?? {}) },
      journey,
      progress,
    };
  } catch {
    return initialState;
  }
}

interface AppContextValue extends AppState {
  /** False until state has been read from localStorage. */
  hydrated: boolean;
  completeOnboarding: (profile: Omit<UserProfile, "onboardingCompleted">, journey: LearningJourney) => void;
  setJourney: (journey: LearningJourney) => void;
  visitLesson: (lessonId: string) => void;
  completeLesson: (lessonId: string) => void;
  toggleSavedInsight: (lessonId: string) => void;
  recordInteraction: (interaction: Omit<Interaction, "at">) => void;
  setLessonFeedback: (lessonId: string, value: Usefulness) => void;
  toggleExperiment: (lessonId: string) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable: keep working in memory */
    }
  }, [state, hydrated]);

  const updateProgress = useCallback(
    (fn: (p: UserProgress, s: AppState) => UserProgress) =>
      setState((s) => ({ ...s, progress: fn(s.progress, s) })),
    [],
  );

  const actions = useMemo(
    () => ({
      completeOnboarding: (
        profile: Omit<UserProfile, "onboardingCompleted">,
        journey: LearningJourney,
      ) => setState((s) => ({ ...s, profile: { ...profile, onboardingCompleted: true }, journey })),
      setJourney: (journey: LearningJourney) => setState((s) => ({ ...s, journey })),
      visitLesson: (lessonId: string) =>
        updateProgress((p) => ({
          ...p,
          recentLessonIds: [lessonId, ...p.recentLessonIds.filter((id) => id !== lessonId)].slice(0, 8),
        })),
      completeLesson: (lessonId: string) =>
        setState((s) => {
          if (s.progress.completedLessonIds.includes(lessonId)) return s;
          const completedLessonIds = [...s.progress.completedLessonIds, lessonId];
          return {
            ...s,
            progress: { ...s.progress, completedLessonIds },
            journey: s.journey
              ? { ...s.journey, currentLessonIndex: nextIndex(s.journey.lessonIds, completedLessonIds) }
              : null,
          };
        }),
      toggleSavedInsight: (lessonId: string) =>
        updateProgress((p) => ({ ...p, savedInsightIds: toggle(p.savedInsightIds, lessonId) })),
      recordInteraction: (interaction: Omit<Interaction, "at">) =>
        updateProgress((p) => ({
          ...p,
          interactionHistory: [
            ...p.interactionHistory,
            { ...interaction, at: new Date().toISOString() },
          ].slice(-200),
        })),
      setLessonFeedback: (lessonId: string, value: Usefulness) =>
        updateProgress((p) => ({ ...p, lessonFeedback: { ...p.lessonFeedback, [lessonId]: value } })),
      toggleExperiment: (lessonId: string) =>
        updateProgress((p) => ({ ...p, reportedExperiments: toggle(p.reportedExperiments, lessonId) })),
      reset: () => setState(initialState),
    }),
    [updateProgress],
  );

  const value = useMemo(() => ({ ...state, hydrated, ...actions }), [state, hydrated, actions]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
