import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  exchangeStravaCode,
  getBootstrap,
  getPlanPreview,
  getStravaConnectUrl,
  syncStravaActivities,
  type BootstrapResponse,
  type PlanPreviewRequest,
  type PlanPreviewResponse,
  type StravaConnectResponse,
  type StravaExchangeResponse,
  type StravaSyncResponse,
} from './lib/api'

type PreferredTime = 'morning' | 'midday' | 'evening'

const equipmentOptions = [
  { value: 'outdoor_running', label: 'Outdoor running' },
  { value: 'peloton', label: 'Peloton' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'rower', label: 'Rower' },
  { value: 'gym', label: 'Gym' },
  { value: 'mobility', label: 'Mobility' },
] as const

const weekDays = [
  { label: 'Sun', name: 'Sunday' },
  { label: 'Mon', name: 'Monday' },
  { label: 'Tue', name: 'Tuesday' },
  { label: 'Wed', name: 'Wednesday' },
  { label: 'Thu', name: 'Thursday' },
  { label: 'Fri', name: 'Friday' },
  { label: 'Sat', name: 'Saturday' },
] as const

const trainingDayOrder = [2, 4, 6, 0, 1, 3, 5] as const

const buildAvailability = (
  weeklyWorkoutTarget: number,
  preferredTime: PreferredTime,
): PlanPreviewRequest['availability'] => {
  const timeConfig = {
    morning: { startMinute: 390, endMinute: 450, label: 'Morning session' },
    midday: { startMinute: 720, endMinute: 780, label: 'Midday session' },
    evening: { startMinute: 1080, endMinute: 1140, label: 'Evening session' },
  }[preferredTime]

  return trainingDayOrder.slice(0, weeklyWorkoutTarget).map((dayOfWeek) => ({
    label: `${weekDays[dayOfWeek].name} ${timeConfig.label}`,
    dayOfWeek,
    startMinute: timeConfig.startMinute,
    endMinute: timeConfig.endMinute,
    partOfDay: preferredTime,
  }))
}

const initialPreferredTime: PreferredTime = 'morning'

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
    summary:
      'I can work out in the morning, I have a Peloton and dumbbells, and I want to become a stronger runner.',
    targetDate: '2026-10-12',
  },
  availability: buildAvailability(4, initialPreferredTime),
  equipment: ['outdoor_running', 'peloton', 'dumbbells'],
  preferences: [
    {
      activityType: 'running',
      preferenceLevel: 'love',
    },
  ],
}

const formatActivityDate = (startedAt: string) =>
  new Date(startedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null)
  const [planForm, setPlanForm] = useState<PlanPreviewRequest>(
    initialPlanPreviewRequest,
  )
  const [planPreview, setPlanPreview] = useState<PlanPreviewResponse | null>(null)
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
  const [preferredTime, setPreferredTime] =
    useState<PreferredTime>(initialPreferredTime)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlanLoading, setIsPlanLoading] = useState(false)
  const [isStravaLoading, setIsStravaLoading] = useState(false)
  const [isCallbackLoading, setIsCallbackLoading] = useState(false)
  const [isStravaSyncLoading, setIsStravaSyncLoading] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [bootstrapData, planPreviewData] = await Promise.all([
        getBootstrap(),
        getPlanPreview(initialPlanPreviewRequest),
      ])

      setBootstrap(bootstrapData)
      setPlanPreview(planPreviewData)
      setStravaRedirectUri(
        bootstrapData.integrations.strava.redirectUri ??
          (typeof window !== 'undefined' ? window.location.origin : ''),
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load workout planner data.',
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
        if (exchange.userId) {
          setStravaUserId(exchange.userId)
        }
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
          : 'Unable to generate the workout plan.',
      )
    } finally {
      setIsPlanLoading(false)
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

  const toggleEquipment = (equipment: string) => {
    setPlanForm((current) => {
      const nextEquipment = current.equipment.includes(equipment)
        ? current.equipment.filter((item) => item !== equipment)
        : [...current.equipment, equipment]

      return {
        ...current,
        equipment: nextEquipment,
      }
    })
  }

  const calendarDays = useMemo(() => {
    const workoutsByDay = new Map(
      (planPreview?.workouts ?? []).map((workout) => [workout.dayLabel, workout]),
    )

    return weekDays.map((day) => ({
      ...day,
      workout: workoutsByDay.get(day.label) ?? null,
    }))
  }, [planPreview])

  if (isLoading) {
    return (
      <main className="app-shell">
        <section className="page-header">
          <p className="kicker">Loading workout planner</p>
          <h1>Workout Planner</h1>
        </section>
      </main>
    )
  }

  if (!bootstrap || !planPreview) {
    return (
      <main className="app-shell">
        <section className="panel">
          <p className="kicker">Unable to load app</p>
          <h1>Workout Planner</h1>
          <p>{error ?? 'Something went wrong.'}</p>
          <button type="button" className="button" onClick={() => void loadData()}>
            Retry
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="page-header">
        <p className="kicker">Minimal adaptive training planner</p>
        <h1>{bootstrap.app.name}</h1>
        <p className="page-copy">
          Connect Strava, describe the kind of athlete you want to become, and
          review the AI-generated week in one place.
        </p>
      </section>

      {error ? (
        <section className="panel panel-error">
          <p>{error}</p>
        </section>
      ) : null}

      <section className="panel section-stack" id="strava">
        <div className="section-heading">
          <div>
            <p className="kicker">Strava workouts</p>
            <h2>Recent imported activity</h2>
          </div>
          <p className="section-meta">
            {bootstrap.integrations.strava.configured
              ? 'Strava is configured.'
              : 'Strava configuration is incomplete.'}
          </p>
        </div>

        <div className="compact-controls">
          <label className="field">
            <span>User ID</span>
            <input
              value={stravaUserId}
              onChange={(event) => setStravaUserId(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button
              type="button"
              className="button"
              onClick={() => void generateStravaConnectUrl()}
            >
              {isStravaLoading ? 'Preparing...' : 'Connect Strava'}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => void runStravaSync()}
            >
              {isStravaSyncLoading ? 'Syncing...' : 'Sync workouts'}
            </button>
          </div>
        </div>

        {stravaConnect ? (
          <a
            className="inline-link"
            href={stravaConnect.authUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open Strava authorization
          </a>
        ) : null}

        {isCallbackLoading ? <p className="section-meta">Finishing Strava connection…</p> : null}

        {stravaExchange ? (
          <div className="status-card">
            <strong>
              Connected as{' '}
              {stravaExchange.athlete.firstname ?? stravaExchange.athlete.username ?? 'athlete'}
            </strong>
            <p>
              {stravaExchange.athlete.username
                ? `@${stravaExchange.athlete.username}`
                : 'Username not available'}
            </p>
          </div>
        ) : null}

        <div className="activity-list">
          {stravaSync?.activities.length ? (
            stravaSync.activities.map((activity) => (
              <article className="activity-card" key={activity.stravaActivityId}>
                <p className="activity-date">{formatActivityDate(activity.startedAt)}</p>
                <h3>{activity.title}</h3>
                <p className="activity-type">{activity.activityType.replace('_', ' ')}</p>
              </article>
            ))
          ) : (
            <article className="activity-card activity-card-empty">
              <h3>No workouts synced yet</h3>
              <p>Connect Strava and run a sync to populate this section.</p>
            </article>
          )}
        </div>
      </section>

      <section className="panel section-stack" id="goals">
        <div className="section-heading">
          <div>
            <p className="kicker">Goals and specifics</p>
            <h2>Tell the planner what matters</h2>
          </div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Name</span>
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
            <span>Primary focus</span>
            <select
              value={planForm.goal.activityType ?? 'running'}
              onChange={(event) => {
                const activityType =
                  event.target.value as NonNullable<
                    PlanPreviewRequest['goal']['activityType']
                  >

                setPlanForm((current) => ({
                  ...current,
                  goal: { ...current.goal, activityType },
                  preferences: [{ activityType, preferenceLevel: 'love' }],
                }))
              }}
            >
              <option value="running">Running</option>
              <option value="cycling">Cycling</option>
              <option value="rowing">Rowing</option>
              <option value="strength">Strength</option>
              <option value="cross_training">Cross-training</option>
            </select>
          </label>

          <label className="field">
            <span>Goal type</span>
            <select
              value={planForm.goal.goalType}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  goal: {
                    ...current.goal,
                    goalType:
                      event.target.value as PlanPreviewRequest['goal']['goalType'],
                  },
                }))
              }
            >
              <option value="race">Race</option>
              <option value="pace">Pace</option>
              <option value="consistency">Consistency</option>
              <option value="weight_loss">Weight loss</option>
              <option value="general_fitness">General fitness</option>
            </select>
          </label>

          <label className="field">
            <span>Preferred workout time</span>
            <select
              value={preferredTime}
              onChange={(event) => {
                const nextPreferredTime = event.target.value as PreferredTime
                setPreferredTime(nextPreferredTime)
                setPlanForm((current) => ({
                  ...current,
                  availability: buildAvailability(
                    current.profile.weeklyWorkoutTarget,
                    nextPreferredTime,
                  ),
                }))
              }}
            >
              <option value="morning">Morning</option>
              <option value="midday">Midday</option>
              <option value="evening">Evening</option>
            </select>
          </label>

          <label className="field">
            <span>Workouts per week</span>
            <input
              type="number"
              min={1}
              max={7}
              value={planForm.profile.weeklyWorkoutTarget}
              onChange={(event) => {
                const weeklyWorkoutTarget = Math.max(
                  1,
                  Math.min(7, Number(event.target.value) || 1),
                )

                setPlanForm((current) => ({
                  ...current,
                  profile: { ...current.profile, weeklyWorkoutTarget },
                  availability: buildAvailability(weeklyWorkoutTarget, preferredTime),
                }))
              }}
            />
          </label>

          <label className="field">
            <span>Experience</span>
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

          <label className="field field-full">
            <span>Goal details and specifics</span>
            <textarea
              rows={4}
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
            <span>Target date</span>
            <input
              type="date"
              value={planForm.goal.targetDate ?? ''}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  goal: {
                    ...current.goal,
                    targetDate: event.target.value || undefined,
                  },
                }))
              }
            />
          </label>
        </div>

        <div className="equipment-list">
          {equipmentOptions.map((equipment) => (
            <label className="equipment-chip" key={equipment.value}>
              <input
                type="checkbox"
                checked={planForm.equipment.includes(equipment.value)}
                onChange={() => toggleEquipment(equipment.value)}
              />
              <span>{equipment.label}</span>
            </label>
          ))}
        </div>

        <button type="button" className="button" onClick={() => void submitPlanPreview()}>
          {isPlanLoading ? 'Generating...' : 'Generate plan'}
        </button>
      </section>

      <section className="panel section-stack" id="plan">
        <div className="section-heading">
          <div>
            <p className="kicker">AI-prescribed workouts</p>
            <h2>This week’s plan</h2>
          </div>
        </div>

        <div className="plan-summary">
          <p>{planPreview.focusSummary}</p>
          <p>{planPreview.recoveryGuidance}</p>
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day) => (
            <article className="calendar-day" key={day.label}>
              <div className="calendar-day-head">
                <span>{day.label}</span>
                <small>{day.name}</small>
              </div>

              {day.workout ? (
                <div className="calendar-workout">
                  <h3>{day.workout.title}</h3>
                  <p className="calendar-meta">
                    {day.workout.timeWindow} · {day.workout.durationMinutes} min
                  </p>
                  <p className="calendar-meta">{day.workout.intensity}</p>
                  <p>{day.workout.rationale}</p>
                </div>
              ) : (
                <div className="calendar-rest">
                  <p>Rest or unplanned day.</p>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
