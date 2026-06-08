import './App.css'

const pillars = [
  {
    title: 'Adaptive weekly planning',
    description:
      'Generate a realistic training week from goals, recent activity, available time, and equipment.',
  },
  {
    title: 'Strava-driven updates',
    description:
      'Import completed workouts automatically and adjust the next sessions when real life changes the plan.',
  },
  {
    title: 'Conversational coaching',
    description:
      'Answer day-of questions about sleep, soreness, available time, and substitutions with structured guidance.',
  },
]

const onboardingSections = [
  {
    title: 'Athlete profile',
    items: [
      'Jordan, intermediate runner with a desk job',
      'Average sleep: 7 hours',
      'Weekly target: 4 workouts',
    ],
  },
  {
    title: 'Goal stack',
    items: [
      'Primary goal: Half marathon in October',
      'Secondary goal: Stay consistent 4x/week',
      'Preference: Loves track-style run workouts',
    ],
  },
  {
    title: 'Schedule + equipment',
    items: [
      'Tuesday morning, Thursday lunch, Saturday morning, Sunday recovery slot',
      'Outdoor running, dumbbells, mobility tools',
      'Future schedule changes are part of the model',
    ],
  },
]

const sampleWeek = [
  {
    day: 'Sun',
    timeWindow: 'Recovery window · 9:00 AM - 10:00 AM',
    title: 'Mobility and recovery',
    details: '25 minutes · easy',
    reason:
      'Keeps the week sustainable after harder work and protects consistency if stress or sleep dips.',
  },
  {
    day: 'Tue',
    timeWindow: 'Before work · 6:30 AM - 7:30 AM',
    title: 'Interval run',
    details: '45 minutes · moderate to hard',
    reason:
      'Targets half-marathon speed development while fitting the highest-energy morning window.',
  },
  {
    day: 'Thu',
    timeWindow: 'Lunch break · 12:00 PM - 1:00 PM',
    title: 'Strength support session',
    details: '35 minutes · steady',
    reason:
      'Uses dumbbells for durability work so the running volume can progress safely.',
  },
  {
    day: 'Sat',
    timeWindow: 'Long session · 8:00 AM - 10:00 AM',
    title: 'Long run',
    details: '75 minutes · easy',
    reason:
      'Builds aerobic endurance toward the October race without crowding the midweek quality day.',
  },
]

const coachMoments = [
  'Only slept five hours? The planner can downgrade intensity and keep the day productive.',
  'Only have 30 minutes? It can condense the session without losing the purpose of the workout.',
  'Did an unplanned long run? It can pull back later intensity instead of pretending nothing changed.',
]

const stravaLifecycle = [
  {
    title: '1. Connect',
    text: 'Start OAuth with Strava so the athlete can authorize historical and ongoing activity access.',
  },
  {
    title: '2. Import',
    text: 'Pull the initial activity history to estimate current volume, pace trends, and consistency.',
  },
  {
    title: '3. React',
    text: 'Accept webhook updates for new activity events and queue plan reevaluation instead of waiting for manual refresh.',
  },
]

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <div className="eyebrow">Adaptive coaching foundation</div>
        <h1>Workout Planner</h1>
        <p className="hero-copy">
          A training app that starts with onboarding context, generates a realistic
          week, and keeps adjusting when workouts, recovery, and schedule reality
          change.
        </p>
        <div className="hero-actions">
          <a href="#onboarding">Onboarding snapshot</a>
          <a href="#preview" className="secondary">
            Generated week preview
          </a>
        </div>
      </section>

      <section className="card-grid" aria-label="Core product pillars">
        {pillars.map((pillar) => (
          <article className="card" key={pillar.title}>
            <h2>{pillar.title}</h2>
            <p>{pillar.description}</p>
          </article>
        ))}
      </section>

      <section className="panel" id="onboarding">
        <div className="section-label">Step 1</div>
        <h2>Structured onboarding context</h2>
        <div className="onboarding-grid">
          {onboardingSections.map((section) => (
            <article className="mini-panel" key={section.title}>
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-label">Step 2</div>
          <h2>How the first adaptive week is assembled</h2>
          <ol>
            <li>Pick the primary activity from goals, preferences, and available equipment.</li>
            <li>Map sessions into real availability windows instead of idealized blank calendar slots.</li>
            <li>Balance quality, endurance, strength, and recovery across the week.</li>
            <li>Attach rationale so every workout explains what job it is doing.</li>
          </ol>
        </article>

        <article className="panel">
          <div className="section-label">Step 3</div>
          <h2>Day-of coaching moments</h2>
          <ul>
            {coachMoments.map((moment) => (
              <li key={moment}>{moment}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="section-label">Strava integration phase</div>
        <h2>Sync lifecycle now mapped in the API</h2>
        <div className="onboarding-grid">
          {stravaLifecycle.map((step) => (
            <article className="mini-panel" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" id="preview">
        <div className="section-label">Generated week preview</div>
        <h2>Example adaptive plan</h2>
        <p className="panel-copy">
          This preview mirrors the new backend planning endpoint: a profile, goal,
          availability windows, and equipment list produce a first-pass week with
          timing, intensity, and rationale.
        </p>
        <div className="week-grid">
          {sampleWeek.map((workout) => (
            <article className="week-card" key={`${workout.day}-${workout.title}`}>
              <div className="week-day">{workout.day}</div>
              <p className="week-window">{workout.timeWindow}</p>
              <h3>{workout.title}</h3>
              <p className="week-details">{workout.details}</p>
              <p className="week-reason">{workout.reason}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
