export type BootstrapResponse = {
  app: {
    name: string;
    mvpTarget: string;
    stack: {
      frontend: string;
      backend: string;
      ai: string;
    };
  };
  planning: {
    supportedActivities: string[];
    supportedEquipment: string[];
    supportedGoals: string[];
  };
  roadmap: {
    completed: string[];
    next: string[];
    releaseOrder: string[];
    mvpTarget: string;
  };
  coachPrompts: string[];
  integrations: {
    strava: {
      provider: string;
      configured: boolean;
      scope: string;
      redirectUri: string | null;
      capabilities: string[];
      missing: string[];
    };
  };
};

export type RoadmapResponse = {
  summary: {
    mvpTarget: string;
    releaseOrder: string[];
  };
  milestones: Array<{
    id: string;
    label: string;
    title: string;
    status: string;
    goal: string;
    deliverables: string[];
  }>;
};

export type PlanPreviewRequest = {
  profile: {
    displayName: string;
    email: string;
    fitnessExperience: "beginner" | "intermediate" | "advanced";
    lifestyleActivityLevel: "desk_job" | "active_job" | "shift_work";
    averageSleepHours?: number;
    weeklyWorkoutTarget: number;
  };
  goal: {
    goalType: "race" | "pace" | "consistency" | "weight_loss" | "general_fitness";
    activityType?: "running" | "cycling" | "rowing" | "strength" | "mobility" | "recovery" | "cross_training";
    summary: string;
    targetDate?: string;
  };
  availability: Array<{
    label: string;
    dayOfWeek: number;
    startMinute: number;
    endMinute: number;
    partOfDay: "morning" | "midday" | "evening" | "custom";
  }>;
  equipment: string[];
  preferences: Array<{
    activityType: string;
    preferenceLevel: "love" | "like" | "neutral" | "avoid";
  }>;
};

export type PlanPreviewResponse = {
  focusSummary: string;
  primaryActivity: string;
  recoveryGuidance: string;
  workouts: Array<{
    dayLabel: string;
    timeWindow: string;
    title: string;
    activityType: string;
    durationMinutes: number;
    intensity: string;
    rationale: string;
  }>;
};

export type CoachPreviewRequest = {
  athleteName: string;
  message: string;
  sleepHours?: number;
  availableMinutes?: number;
  soreness?: boolean;
  currentWorkout: {
    title: string;
    activityType: "running" | "cycling" | "rowing" | "strength" | "mobility" | "recovery" | "cross_training";
    durationMinutes: number;
    intensity: string;
    rationale: string;
  };
};

export type CoachPreviewResponse = {
  decision: string;
  responseMessage: string;
  updatedWorkout: {
    title: string;
    activityType: string;
    durationMinutes: number;
    intensity: string;
    rationale: string;
  };
  rationale: string[];
  aiContract: {
    provider: string;
    mode: string;
    nextStep: string;
  };
};

export type StravaConnectRequest = {
  userId: string;
  redirectUri?: string;
};

export type StravaConnectResponse = {
  authUrl: string;
  state: string;
  scope: string;
  redirectUri: string;
};

export type StravaExchangeRequest = {
  code: string;
  scope?: string;
  state?: string;
  redirectUri?: string;
};

export type StravaExchangeResponse = {
  connected: boolean;
  provider: string;
  userId: string | null;
  redirectUri: string;
  scope: string;
  athlete: {
    id: number;
    username: string | null;
    firstname: string | null;
    lastname: string | null;
  };
  tokenType: string;
  expiresAt: number;
  expiresIn: number;
  persistence: string;
  nextAction: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

const getApiUrl = (path: string) => `${API_BASE_URL}${path}`;

const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(getApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path} with status ${response.status}`);
  }

  return (await response.json()) as T;
};

export const getBootstrap = () => fetchJson<BootstrapResponse>("/api/bootstrap");

export const getRoadmap = () => fetchJson<RoadmapResponse>("/api/roadmap");

export const getPlanPreview = (payload: PlanPreviewRequest) =>
  fetchJson<PlanPreviewResponse>("/api/plan-preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getCoachPreview = (payload: CoachPreviewRequest) =>
  fetchJson<CoachPreviewResponse>("/api/coach/respond", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getStravaConnectUrl = (payload: StravaConnectRequest) =>
  fetchJson<StravaConnectResponse>("/api/strava/connect-url", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const exchangeStravaCode = (payload: StravaExchangeRequest) =>
  fetchJson<StravaExchangeResponse>("/api/strava/exchange", {
    method: "POST",
    body: JSON.stringify(payload),
  });
