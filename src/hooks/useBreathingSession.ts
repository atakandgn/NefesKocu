import { useState, useEffect, useCallback, useRef } from "react";
import * as Haptics from "expo-haptics";
import { Audio, AVPlaybackSource } from "expo-av";

export type BreathingPhase =
  | "inhale"
  | "holdIn"
  | "exhale"
  | "holdOut"
  | "idle";

export interface BreathingPattern {
  id: string;
  name: string;
  nameShort: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  recommendedRounds: { min: number; max: number };
  description: string;
}

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: "4-7-8",
    name: "4-7-8 Relaxation",
    nameShort: "4-7-8",
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    recommendedRounds: { min: 3, max: 6 },
    description: "Calms nervous system, helps sleep",
  },
  {
    id: "box",
    name: "Box Breathing",
    nameShort: "Box 4-4-4-4",
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    recommendedRounds: { min: 4, max: 8 },
    description: "Navy SEAL technique for focus",
  },
  {
    id: "4-6",
    name: "Relaxing Ratio",
    nameShort: "4-6",
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
    recommendedRounds: { min: 12, max: 30 },
    description: "Simple calming breath",
  },
  {
    id: "5-5",
    name: "Equal Breath",
    nameShort: "5-5",
    inhale: 5,
    holdIn: 0,
    exhale: 5,
    holdOut: 0,
    recommendedRounds: { min: 12, max: 30 },
    description: "Sama Vritti - balanced energy",
  },
  {
    id: "6-6",
    name: "Deep Equal Breath",
    nameShort: "6-6",
    inhale: 6,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
    recommendedRounds: { min: 10, max: 25 },
    description: "Deeper relaxation",
  },
  {
    id: "2-4",
    name: "Quick Calm",
    nameShort: "2-4",
    inhale: 2,
    holdIn: 0,
    exhale: 4,
    holdOut: 0,
    recommendedRounds: { min: 10, max: 30 },
    description: "Fast stress relief",
  },
  {
    id: "3-6",
    name: "Gentle Exhale",
    nameShort: "3-6",
    inhale: 3,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
    recommendedRounds: { min: 12, max: 30 },
    description: "Soft extended exhale",
  },
  {
    id: "4-8",
    name: "1:2 Ratio",
    nameShort: "4-8",
    inhale: 4,
    holdIn: 0,
    exhale: 8,
    holdOut: 0,
    recommendedRounds: { min: 5, max: 25 },
    description: "Classic relaxation ratio",
  },
  {
    id: "coherent",
    name: "Coherent Breathing",
    nameShort: "5.5-5.5",
    inhale: 5.5,
    holdIn: 0,
    exhale: 5.5,
    holdOut: 0,
    recommendedRounds: { min: 27, max: 54 },
    description: "Heart-brain synchronization",
  },
];

interface UseBreathingSessionOptions {
  pattern?: BreathingPattern;
  enableHaptics?: boolean;
  enableSound?: boolean;
  targetRounds?: number;
}

interface UseBreathingSessionReturn {
  phase: BreathingPhase;
  phaseProgress: number;
  phaseDuration: number;
  phaseTimeRemaining: number;
  cycleCount: number;
  totalSessionTime: number;
  isPlaying: boolean;
  isPaused: boolean;
  pattern: BreathingPattern;
  targetRounds: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setPattern: (pattern: BreathingPattern) => void;
  setTargetRounds: (rounds: number) => void;
}

export function useBreathingSession(
  options: UseBreathingSessionOptions = {}
): UseBreathingSessionReturn {
  const {
    pattern: initialPattern = BREATHING_PATTERNS[0],
    enableHaptics = true,
    enableSound = false,
    targetRounds: initialTargetRounds = 4,
  } = options;

  const [pattern, setPattern] = useState<BreathingPattern>(initialPattern);
  const [targetRounds, setTargetRounds] = useState(initialTargetRounds);
  const [phase, setPhase] = useState<BreathingPhase>("idle");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [phaseDuration, setPhaseDuration] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseStartTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const triggerHaptic = useCallback(
    (type: "light" | "medium" | "heavy" = "medium") => {
      if (!enableHaptics) return;

      switch (type) {
        case "light":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    },
    [enableHaptics]
  );

  const getPhaseDuration = useCallback(
    (currentPhase: BreathingPhase): number => {
      switch (currentPhase) {
        case "inhale":
          return pattern.inhale;
        case "holdIn":
          return pattern.holdIn;
        case "exhale":
          return pattern.exhale;
        case "holdOut":
          return pattern.holdOut;
        default:
          return 0;
      }
    },
    [pattern]
  );

  const getNextPhase = useCallback(
    (currentPhase: BreathingPhase): BreathingPhase => {
      switch (currentPhase) {
        case "idle":
          return "inhale";
        case "inhale":
          return pattern.holdIn > 0 ? "holdIn" : "exhale";
        case "holdIn":
          return "exhale";
        case "exhale":
          return pattern.holdOut > 0 ? "holdOut" : "inhale";
        case "holdOut":
          return "inhale";
        default:
          return "inhale";
      }
    },
    [pattern]
  );

  const transitionToPhase = useCallback(
    (newPhase: BreathingPhase) => {
      setPhase(newPhase);
      const duration = getPhaseDuration(newPhase);
      setPhaseDuration(duration);
      setPhaseTimeRemaining(duration);
      setPhaseProgress(0);
      phaseStartTimeRef.current = Date.now();

      if (newPhase === "inhale" && phase !== "idle") {
        setCycleCount((prev) => prev + 1);
      }

      triggerHaptic(newPhase === "inhale" ? "heavy" : "medium");
    },
    [getPhaseDuration, phase, triggerHaptic]
  );

  const tick = useCallback(() => {
    if (!isPlaying || isPaused) return;

    const now = Date.now();
    const phaseElapsed = (now - phaseStartTimeRef.current) / 1000;
    const currentPhaseDuration = getPhaseDuration(phase);
    const remaining = Math.max(0, currentPhaseDuration - phaseElapsed);
    const progress =
      currentPhaseDuration > 0
        ? Math.min(1, phaseElapsed / currentPhaseDuration)
        : 1;

    setPhaseTimeRemaining(remaining);
    setPhaseProgress(progress);
    setTotalSessionTime((now - sessionStartTimeRef.current) / 1000);

    if (remaining <= 0) {
      const nextPhase = getNextPhase(phase);
      transitionToPhase(nextPhase);
    }
  }, [
    isPlaying,
    isPaused,
    phase,
    getPhaseDuration,
    getNextPhase,
    transitionToPhase,
  ]);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      intervalRef.current = setInterval(tick, 50);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isPaused, tick]);

  const start = useCallback(() => {
    setIsPlaying(true);
    setIsPaused(false);
    setCycleCount(0);
    setTotalSessionTime(0);
    sessionStartTimeRef.current = Date.now();
    transitionToPhase("inhale");
    triggerHaptic("heavy");
  }, [transitionToPhase, triggerHaptic]);

  const pause = useCallback(() => {
    setIsPaused(true);
    pausedTimeRef.current = Date.now();
    triggerHaptic("light");
  }, [triggerHaptic]);

  const resume = useCallback(() => {
    const pauseDuration = Date.now() - pausedTimeRef.current;
    phaseStartTimeRef.current += pauseDuration;
    sessionStartTimeRef.current += pauseDuration;
    setIsPaused(false);
    triggerHaptic("light");
  }, [triggerHaptic]);

  const stop = useCallback(async () => {
    setIsPlaying(false);
    setIsPaused(false);
    setPhase("idle");
    setPhaseProgress(0);
    setPhaseDuration(0);
    setPhaseTimeRemaining(0);
    triggerHaptic("heavy");

    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }, [triggerHaptic]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return {
    phase,
    phaseProgress,
    phaseDuration,
    phaseTimeRemaining,
    cycleCount,
    totalSessionTime,
    isPlaying,
    isPaused,
    pattern,
    targetRounds,
    start,
    pause,
    resume,
    stop,
    setPattern,
    setTargetRounds,
  };
}
