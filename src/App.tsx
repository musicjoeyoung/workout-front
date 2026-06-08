import { useCallback, useEffect, useState } from 'react'
import './App.css'
import {
  exchangeStravaCode,
  getBootstrap,
  getCoachPreview,
  getPlanPreview,
  getRoadmap,
  getStravaConnectUrl,
  syncStravaActivities,
  type BootstrapResponse,
  type CoachPreviewRequest,
  type CoachPreviewResponse,
  type PlanPreviewRequest,
  type PlanPreviewResponse,
  type RoadmapResponse,
  type StravaConnectResponse,
  type StravaExchangeResponse,
  type StravaSyncResponse,
} from './lib/api'

const initialPlanPreviewRequest: PlanPreviewRequest = {
  profile: {
    displayName: 'Jordan',
    email: 'jordan@example.com',
    fitnessExperience: 'intermediate',
    lifestyleActivityLevel: 'desk_job',
    averageSleepHours: 7,
    weeklyWorkoutTarget: 4,
  },
  goal: {
    goalType: 'race',
    activityType: 'running',
    summary: 'Run a half marathon in October',
    targetDate: '2026-10-12',
  },
  availability: [
    {
      label: 'Early Tuesday',
      dayOfWeek: 2,
      startMinute: 390,
      endMinute: 450,
      partOfDay: 'morning',
    },
    {
      label: 'Thursday lunch',
      dayOfWeek: 4,
      startMinute: 720,
      endMinute: 780,
      partOfDay: 'midday',
    },
    {
      label: 'Saturday long session',
      dayOfWeek: 6,
      startMinute: 480,
      endMinute: 600,
      partOfDay: 'morning',
    },
    {
      label: 'Sunday recovery',
      dayOfWeek: 0,
      startMinute: 540,
      endMinute: 600,
      partOfDay: 'morning',
    },
  ],
  equipment: ['outdoor_running', 'dumbbells', 'mobility'],
  preferences: [
    {
      activityType: 'running',
      preferenceLevel: 'love',
    },
  ],
}

const initialCoachPreviewRequest: CoachPreviewRequest = {
  athleteName: 'Jordan',
  message:
    'I only slept five hours and my legs feel sore. Should I still do today’s interval run?',
  sleepHours: 5,
  availableMinutes: 30,
  soreness: true,
  currentWorkout: {
    title: 'Interval run',
    activityType: 'running',
    durationMinutes: 45,
    intensity: 'Moderate to hard',
    rationale: 'Targets half-marathon speed development.',
  },
}

function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null)
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null)
  const [planForm, setPlanForm] = useState<PlanPreviewRequest>(
    initialPlanPreviewRequest,
  )
  const [coachForm, setCoachForm] = useState<CoachPreviewRequest>(
    initialCoachPreviewRequest,
  )
  const [planPreview, setPlanPreview] = useState<PlanPreviewResponse | null>(null)
  const [coachPreview, setCoachPreview] = useState<CoachPreviewResponse | null>(
    null,
  )
  const [stravaConnect, setStravaConnect] = useState<StravaConnectResponse | null>(
    null,
  )
  const [stravaExchange, setStravaExchange] = useState<StravaExchangeResponse | null>(
    null,
  )
  const [stravaSync, setStravaSync] = useState<StravaSyncResponse | null>(null)
  const [stravaUserId, setStravaUserId] = useState(
    '550e8400-e29b-41d4-a716-446655440000',
  )
  const [stravaRedirectUri, setStravaRedirectUri] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlanLoading, setIsPlanLoading] = useState(false)
  const [isCoachLoading, setIsCoachLoading] = useState(false)
  const [isStravaLoading, setIsStravaLoading] = useState(false)
  const [isCallbackLoading, setIsCallbackLoading] = useState(false)
  const [isStravaSyncLoading, setIsStravaSyncLoading] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [bootstrapData, roadmapData, planPreviewData, coachPreviewData] =
        await Promise.all([
          getBootstrap(),
          getRoadmap(),
          getPlanPreview(initialPlanPreviewRequest),
          getCoachPreview(initialCoachPreviewRequest),
        ])

      setBootstrap(bootstrapData)
      setRoadmap(roadmapData)
      setPlanPreview(planPreviewData)
      setCoachPreview(coachPreviewData)
      setStravaRedirectUri(
        bootstrapData.integrations.strava.redirectUri ??
          (typeof window !== 'undefined' ? window.location.origin : ''),
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load workout app data.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!bootstrap || typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) {
      return
    }

    const scope = params.get('scope') ?? undefined
    const state = params.get('state') ?? undefined

    const runExchange = async () => {
      setIsCallbackLoading(true)
      setError(null)

      try {
        const exchange = await exchangeStravaCode({
          code,
          scope,
          state,
          redirectUri:
            bootstrap.integrations.strava.redirectUri ?? window.location.origin,
        })
        setStravaExchange(exchange)
        window.history.replaceState({}, '', window.location.pathname)
      } catch (exchangeError) {
        setError(
          exchangeError instanceof Error
            ? exchangeError.message
            : 'Unable to complete the Strava callback exchange.',
        )
      } finally {
        setIsCallbackLoading(false)
      }
    }

    void runExchange()
  }, [bootstrap])

  const updateAvailability = (
    index: number,
    key: keyof PlanPreviewRequest['availability'][number],
    value: number | string,
  ) => {
    setPlanForm((current) => ({
      ...current,
      availability: current.availability.map((window, windowIndex) =>
        windowIndex === index ? { ...window, [key]: value } : window,
      ),
    }))
  }

  const submitPlanPreview = async () => {
    setIsPlanLoading(true)
    setError(null)

    try {
      const preview = await getPlanPreview(planForm)
      setPlanPreview(preview)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to generate the adaptive week preview.',
      )
    } finally {
      setIsPlanLoading(false)
    }
  }

  const submitCoachPreview = async () => {
    setIsCoachLoading(true)
    setError(null)

    try {
      const preview = await getCoachPreview(coachForm)
      setCoachPreview(preview)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to get a coaching response.',
      )
    } finally {
      setIsCoachLoading(false)
    }
  }

  const generateStravaConnectUrl = async () => {
    setIsStravaLoading(true)
    setError(null)

    try {
      const response = await getStravaConnectUrl({
        userId: stravaUserId,
        redirectUri: stravaRedirectUri || undefined,
      })
      setStravaConnect(response)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to generate the Strava connect URL.',
      )
    } finally {
      setIsStravaLoading(false)
    }
  }

  const runStravaSync = async () => {
    setIsStravaSyncLoading(true)
    setError(null)

    try {
      const response = await syncStravaActivities({
        userId: stravaUserId,
      })
      setStravaSync(response)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to sync Strava activities.',
      )
    } finally {
      setIsStravaSyncLoading(false)
    }
  }

  if (isLoading) {
    return (
      <main className="app-shell">
        <section className="hero">
          <div className="eyebrow">Loading live contracts</div>
          <h1>Workout Planner</h1>
          <p className="hero-copy">
            Pulling bootstrap metadata, roadmap milestones, adaptive plan output,
            and coach guidance from the backend.
          </p>
        </section>
      </main>
    )
  }

  if ((!bootstrap || !roadmap || !planPreview || !coachPreview) && error) {
    return (
      <main className="app-shell">
        <section className="panel error-panel">
          <div className="section-label">Backend connection issue</div>
          <h1>Workout Planner</h1>
          <p>{error ?? 'Unable to load app data.'}</p>
          <button
            type="button"
            className="retry-button"
            onClick={() => void loadData()}
          >
            Retry loading
          </button>
        </section>
      </main>
    )
  }

  if (!bootstrap || !roadmap || !planPreview || !coachPreview) {
    return null
  }

  const stravaStatus = bootstrap.integrations.strava
  const currentMilestone = roadmap.milestones.find(
    (milestone) => milestone.id === roadmap.summary.mvpTarget,
  )

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="eyebrow">Interactive OAuth-ready MVP shell</div>
        <h1>{bootstrap.app.name}</h1>
        <p className="hero-copy">
          The frontend now edits request payloads, launches the Strava OAuth flow,
          handles callback query params, and renders live responses from the
          workout API.
        </p>
        <div className="hero-actions">
          <a href="#strava">Strava connection</a>
          <a href="#preview" className="secondary">
            Adaptive week preview
          </a>
        </div>
      </section>

      <section className="card-grid" aria-label="Live product metadata">
        <article className="card">
          <h2>MVP target</h2>
          <p>
            {currentMilestone?.label}: {currentMilestone?.title}
          </p>
        </article>
        <article className="card">
          <h2>Strava status</h2>
          <p>{stravaStatus.configured ? 'Configured' : 'Configuration missing'}</p>
        </article>
        <article className="card">
          <h2>Coach engine</h2>
          <p>{coachPreview.aiContract.provider}</p>
        </article>
      </section>

      {error ? (
        <section className="panel error-panel">
          <div className="section-label">Request status</div>
          <p>{error}</p>
        </section>
      ) : null}

      <section className="panel" id="onboarding">
        <div className="section-label">Interactive planner inputs</div>
        <h2>Generate an adaptive week from editable form data</h2>
        <div className="form-grid">
          <label className="field">
            <span>Display name</span>
            <input
              value={planForm.profile.displayName}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  profile: { ...current.profile, displayName: event.target.value },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              value={planForm.profile.email}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  profile: { ...current.profile, email: event.target.value },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Fitness experience</span>
            <select
              value={planForm.profile.fitnessExperience}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  profile: {
                    ...current.profile,
                    fitnessExperience:
                      event.target.value as PlanPreviewRequest['profile']['fitnessExperience'],
                  },
                }))
              }
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="field">
            <span>Weekly workout target</span>
            <input
              type="number"
              min="1"
              max="7"
              value={planForm.profile.weeklyWorkoutTarget}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  profile: {
                    ...current.profile,
                    weeklyWorkoutTarget: Number(event.target.value),
                  },
                }))
              }
            />
          </label>
          <label className="field field-full">
            <span>Goal summary</span>
            <input
              value={planForm.goal.summary}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  goal: { ...current.goal, summary: event.target.value },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Goal activity</span>
            <select
              value={planForm.goal.activityType ?? 'running'}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  goal: {
                    ...current.goal,
                    activityType:
                      event.target.value as NonNullable<
                        PlanPreviewRequest['goal']['activityType']
                      >,
                  },
                  preferences: current.preferences.map((preference, index) =>
                    index === 0
                      ? { ...preference, activityType: event.target.value }
                      : preference,
                  ),
                }))
              }
            >
              {bootstrap.planning.supportedActivities.map((activity) => (
                <option key={activity} value={activity}>
                  {activity.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Target date</span>
            <input
              type="date"
              value={planForm.goal.targetDate ?? ''}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  goal: { ...current.goal, targetDate: event.target.value },
                }))
              }
            />
          </label>
          <label className="field field-full">
            <span>Equipment (comma separated)</span>
            <input
              value={planForm.equipment.join(', ')}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  equipment: event.target.value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                }))
              }
            />
          </label>
        </div>
        <div className="availability-grid">
          {planForm.availability.map((window, index) => (
            <article className="mini-panel" key={`${window.label}-${index}`}>
              <h3>{window.label}</h3>
              <div className="form-grid compact-grid">
                <label className="field">
                  <span>Day</span>
                  <select
                    value={window.dayOfWeek}
                    onChange={(event) =>
                      updateAvailability(index, 'dayOfWeek', Number(event.target.value))
                    }
                  >
                    <option value="0">Sun</option>
                    <option value="1">Mon</option>
                    <option value="2">Tue</option>
                    <option value="3">Wed</option>
                    <option value="4">Thu</option>
                    <option value="5">Fri</option>
                    <option value="6">Sat</option>
                  </select>
                </label>
                <label className="field">
                  <span>Start minute</span>
                  <input
                    type="number"
                    value={window.startMinute}
                    onChange={(event) =>
                      updateAvailability(index, 'startMinute', Number(event.target.value))
                    }
                  />
                </label>
                <label className="field">
                  <span>End minute</span>
                  <input
                    type="number"
                    value={window.endMinute}
                    onChange={(event) =>
                      updateAvailability(index, 'endMinute', Number(event.target.value))
                    }
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
        <div className="button-row">
          <button
            type="button"
            className="retry-button"
            onClick={() => void submitPlanPreview()}
          >
            {isPlanLoading ? 'Generating...' : 'Generate adaptive week'}
          </button>
        </div>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-label">Live planning metadata</div>
          <h2>What the backend says this planner supports</h2>
          <div className="tag-list">
            {bootstrap.planning.supportedActivities.map((activity) => (
              <span className="tag" key={activity}>
                {activity.replace('_', ' ')}
              </span>
            ))}
          </div>
          <p className="panel-copy">
            Supported goals: {bootstrap.planning.supportedGoals.join(', ')}.
          </p>
        </article>

        <article className="panel">
          <div className="section-label">Coach prompts</div>
          <h2>Seed questions from the bootstrap contract</h2>
          <ul>
            {bootstrap.coachPrompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel" id="strava">
        <div className="section-label">Strava OAuth flow</div>
        <h2>Generate and complete the Strava connect loop</h2>
        <p className="panel-copy">
          Backend redirect URI: <strong>{stravaStatus.redirectUri ?? 'not set'}</strong>
        </p>
        <div className="tag-list">
          {stravaStatus.capabilities.map((capability) => (
            <span className="tag" key={capability}>
              {capability}
            </span>
          ))}
        </div>
        <div className="form-grid compact-grid">
          <label className="field field-full">
            <span>User UUID</span>
            <input
              value={stravaUserId}
              onChange={(event) => setStravaUserId(event.target.value)}
            />
          </label>
          <label className="field field-full">
            <span>Redirect URI</span>
            <input
              value={stravaRedirectUri}
              onChange={(event) => setStravaRedirectUri(event.target.value)}
            />
          </label>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="retry-button"
            onClick={() => void generateStravaConnectUrl()}
          >
            {isStravaLoading ? 'Generating...' : 'Generate Strava connect URL'}
          </button>
          <button
            type="button"
            className="retry-button secondary-button"
            onClick={() => void runStravaSync()}
          >
            {isStravaSyncLoading ? 'Syncing...' : 'Sync Strava activities'}
          </button>
          {stravaConnect ? (
            <a
              className="inline-link-button"
              href={stravaConnect.authUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open Strava authorization
            </a>
          ) : null}
        </div>
        {stravaConnect ? (
          <p className="panel-copy">
            Generated redirect URI: <strong>{stravaConnect.redirectUri}</strong>
          </p>
        ) : null}
        {isCallbackLoading ? (
          <p className="panel-copy">Completing Strava callback exchange...</p>
        ) : null}
        {stravaExchange ? (
          <div className="mini-panel callback-panel">
            <h3>Latest callback result</h3>
            <p>
              Connected athlete: {stravaExchange.athlete.firstname ?? ''}{' '}
              {stravaExchange.athlete.lastname ?? ''} ({stravaExchange.athlete.username ?? 'no username'})
            </p>
            <p>User UUID from state: {stravaExchange.userId ?? 'not provided'}</p>
            <p>Token persistence: {stravaExchange.persistence}</p>
            <p>{stravaExchange.nextAction}</p>
          </div>
        ) : null}
        {stravaSync ? (
          <div className="mini-panel callback-panel">
            <h3>Latest sync result</h3>
            <p>Imported activities: {stravaSync.importedCount}</p>
            <ul>
              {stravaSync.activities.map((activity) => (
                <li key={activity.stravaActivityId}>
                  {activity.title} · {activity.activityType}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="section-label">Coach response preview</div>
        <h2>Ask the coach with editable inputs</h2>
        <div className="form-grid">
          <label className="field">
            <span>Athlete name</span>
            <input
              value={coachForm.athleteName}
              onChange={(event) =>
                setCoachForm((current) => ({
                  ...current,
                  athleteName: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Sleep hours</span>
            <input
              type="number"
              min="0"
              max="24"
              value={coachForm.sleepHours ?? ''}
              onChange={(event) =>
                setCoachForm((current) => ({
                  ...current,
                  sleepHours:
                    event.target.value === ''
                      ? undefined
                      : Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="field">
            <span>Available minutes</span>
            <input
              type="number"
              min="1"
              value={coachForm.availableMinutes ?? ''}
              onChange={(event) =>
                setCoachForm((current) => ({
                  ...current,
                  availableMinutes:
                    event.target.value === ''
                      ? undefined
                      : Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="field checkbox-field">
            <span>Soreness reported</span>
            <input
              type="checkbox"
              checked={coachForm.soreness ?? false}
              onChange={(event) =>
                setCoachForm((current) => ({
                  ...current,
                  soreness: event.target.checked,
                }))
              }
            />
          </label>
          <label className="field field-full">
            <span>Question</span>
            <textarea
              rows={3}
              value={coachForm.message}
              onChange={(event) =>
                setCoachForm((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Current workout</span>
            <input
              value={coachForm.currentWorkout.title}
              onChange={(event) =>
                setCoachForm((current) => ({
                  ...current,
                  currentWorkout: {
                    ...current.currentWorkout,
                    title: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Current duration</span>
            <input
              type="number"
              min="1"
              value={coachForm.currentWorkout.durationMinutes}
              onChange={(event) =>
                setCoachForm((current) => ({
                  ...current,
                  currentWorkout: {
                    ...current.currentWorkout,
                    durationMinutes: Number(event.target.value),
                  },
                }))
              }
            />
          </label>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="retry-button"
            onClick={() => void submitCoachPreview()}
          >
            {isCoachLoading ? 'Asking coach...' : 'Ask coach'}
          </button>
        </div>
        <div className="two-column">
          <article className="mini-panel">
            <h3>Coach response</h3>
            <p>{coachPreview.responseMessage}</p>
            <p className="coach-workout">
              {coachPreview.updatedWorkout.title} ·{' '}
              {coachPreview.updatedWorkout.durationMinutes} minutes ·{' '}
              {coachPreview.updatedWorkout.intensity}
            </p>
          </article>
          <article className="mini-panel">
            <h3>Decision context</h3>
            <ul>
              {coachPreview.rationale.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="panel" id="roadmap">
        <div className="section-label">Delivery roadmap</div>
        <h2>Sequenced milestones from the API</h2>
        <div className="roadmap-grid">
          {roadmap.milestones.map((milestone) => (
            <article className="milestone-card" key={milestone.id}>
              <p className="milestone-label">{milestone.label}</p>
              <h3>{milestone.title}</h3>
              <p className="milestone-status">{milestone.status}</p>
              <p>{milestone.goal}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" id="preview">
        <div className="section-label">Generated week preview</div>
        <h2>Live adaptive plan output</h2>
        <p className="panel-copy">{planPreview.focusSummary}</p>
        <p className="panel-copy">{planPreview.recoveryGuidance}</p>
        <div className="week-grid">
          {planPreview.workouts.map((workout) => (
            <article className="week-card" key={`${workout.dayLabel}-${workout.title}`}>
              <div className="week-day">{workout.dayLabel}</div>
              <p className="week-window">{workout.timeWindow}</p>
              <h3>{workout.title}</h3>
              <p className="week-details">
                {workout.durationMinutes} minutes · {workout.intensity}
              </p>
              <p className="week-reason">{workout.rationale}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
