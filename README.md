# TaskyPulse

Personal productivity PWA for daily work and university: tasks, classes, exams, habits, focus, and a one-page daily PDF.

Live: [taskypulse.netlify.app](https://taskypulse.netlify.app)

## What it does

- **My Day** — dated tasks, Big 3 goals, today’s classes, exam countdowns, time schedule (check off blocks), habits, and focus minutes
- **Tasks** — kanban by default (To do / In progress / Done) plus a list view; status chips are white / yellow / green
- **Calendar** — tasks, class meetings, and exams on the same month
- **Classes & exams** — pin an exam against a class (AI, ML, …) on any date, with an optional syllabus
- **Habits, Focus, Matrix, Notes, Stats** — streaks, pomodoro sessions, Eisenhower, scratchpad, charts
- **Today’s PDF** — one A4 page with logo, your name, date, tasks, classes, schedule, and habits
- **Reminders** — optional PWA notifications for class, exams, and overdue tasks (best after Add to Home Screen)
- **Theme** — light or dark, stored on this device only

Data lives in Firebase Auth + Firestore under `users/{uid}/…`. Theme is local (`taskpulse-theme`).

## Stack

Vite, React, TypeScript, Tailwind v4, React Router, Firebase, `vite-plugin-pwa`.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with your Firebase web app keys (`VITE_FIREBASE_*`). In the Firebase console:

1. Enable **Email/Password** authentication
2. Create a **Firestore** database
3. Publish `firestore.rules` (each signed-in user can only read/write `users/{theirUid}/**`)

## Scripts

```bash
npm run dev      # Vite
npm run build    # typecheck + production bundle
npm run preview  # serve dist
npm run lint     # oxlint
```

## Deploy (Netlify)

Connect this GitHub repo.

- Build command: `npm run build`
- Publish directory: `dist`
- Environment: the same `VITE_FIREBASE_*` variables as `.env`

After deploy, install as a PWA from the browser (Add to Home Screen) if you want reminders and an app icon.

Do not commit `.env`.
