# TaskyPulse

TaskyPulse is a personal productivity PWA for work and university. It keeps one signed-in user’s day in one place: tasks, classes, exams, a timed schedule, habits, focus sessions, and a printable one-page daily plan.

Live: [taskypulse.netlify.app](https://taskypulse.netlify.app)

Repo: [github.com/fahim-shahriar-alif/TaskPulse](https://github.com/fahim-shahriar-alif/TaskPulse)

Sign in with email and password, or open **Create an account** (`/register`) the first time. Everything you add is stored in Firestore under your user id. Light and dark appearance stays on **this device** only and does not follow you to other logins.

---

## Features

### My Day (`/`)

Home screen for “what is happening today.”

- Live date plus a digital clock on the same row
- Greeting, KPI chips (open today, done, focus minutes, habits)
- Next-class banner with a live countdown (or “happening now”) when you have a class today
- Exam countdown chips for upcoming tests and deadlines
- Completion ring for dated tasks due today
- Overdue tasks called out separately
- **Today’s tasks** — due today, plus undated open items
- **Big 3 non-negotiables** — three free-text goals for this date only (not linked to the kanban)
- **Today’s classes** — name, room, time, Live / countdown tags
- **Exams & deadlines** — class name, kind, syllabus snippet, days left; pin a new exam from here
- **Today’s schedule** — from–to blocks. Check a block done: green tick, green left border, struck-through title. Saved with that day. An **amber** edge and “Overlaps …” line appear if a block collides with a class or another range
- Habit quick-check, a **notes pad** (quick capture + latest notes), and a shortcut into Focus
- Layout is paired cards on a wide screen so the page does not dump everything down one column

### Tasks (`/tasks`)

Opens on the **kanban** board (list view is still one tap away).

- Columns: **To do** (white signal), **In progress** (yellow), **Done** (green)
- Drag a card between columns; Done also marks the task complete
- List view: search, smart lists (all, today, tomorrow, week, inbox, overdue, done), list filter (Work / Study / Personal / Health), priority filter
- Add a task with title, list, priority, due date, recurrence (none / daily / weekly / weekdays), tags (deep, quick, waiting, home), and notes
- Tap any task (My Day, Tasks, Calendar, Matrix, Focus) to open the same **task sheet**: status, list, priority, due date, recurrence, tags, notes, subtasks, pomodoro count, delete

### Calendar (`/calendar`)

One month for tasks, classes, and exams together.

- Day dots: indigo = tasks due that day, cyan = a class meets, amber = exam or deadline
- Tap a day: classes (with times), exams (with class + kind + syllabus), and tasks
- Recurring classes (weekly, every two weeks, or once) light up the days they actually meet
- An exam can sit on any date — it does not have to be a class day
- Prev / Today / Next month; Today also selects today’s date

### Classes (`/classes`)

University timetable, or **Others** with a name you write.

- Type: University or Others
- University: name plus optional course code. Others: write the name yourself
- Room, days of week, from–to time
- Repeat: weekly, every two weeks (anchor week), or once on a chosen date
- Classes cannot share a day and overlapping times — save is blocked until the clash is gone
- **Add exam** on a class card pre-selects that class (AI exam, ML exam, …)
- Upcoming exam dates for that class show on the card

### Exams (`/deadlines`)

Exams and other due dates, always **against a class** when the kind is Exam.

- Pick the class, any date, optional label (Midterm, Quiz 1), optional **syllabus** (topics, chapters, labs)
- Kinds: Exam, Assignment, Deadline
- Upcoming vs past, with a live countdown
- Shown on My Day, Calendar, Stats, reminders, and the daily PDF

### Schedule (`/schedule`)

Custom from–to ranges for the current day (study blocks, meals, sleep — whatever you name).

- Add range, edit times and activity, delete, or reset the whole day
- Done checkmarks are toggled on My Day and stored on the same day document
- Conflict warning if a range overlaps a class that meets today, or another personal block

### Habits (`/habits`)

Daily check-ins and streaks.

- Add / delete habits
- Tap to mark today done; streak counts consecutive days
- Also checkable from My Day; appear on Stats bars and the daily PDF

### Focus (`/focus`)

Pomodoro timer.

- Focus length and break length come from Profile settings (defaults 25 / 5 minutes)
- Optional linked open task; a finished focus session increments that task’s pomodoro count
- Sessions are logged by date and show up on Stats and My Day
- Full-screen mode (Escape to leave)

### Matrix (`/matrix`)

Eisenhower board for **open** tasks.

| Quadrant | Rule |
| --- | --- |
| Do now | High priority and due today or overdue |
| Schedule | High priority, not urgent |
| Delegate / quick | Urgent, not high priority |
| Later | Neither |

### Stats (`/stats`)

Charts from your real data (no extra chart library).

- KPI chips: open today, done this week, focus minutes, best streak, overdue, upcoming exams, classes this week, all-time focus
- Completion ring + progress bars (today, due this week, overdue vs open)
- Status pie (To do / In progress / Done)
- 14-day bar chart of finished tasks
- 7-day focus bars
- List pie (Work, Study, Personal, Health) and completion per list
- Priority pie
- Habit bars for the current week
- Exam countdown bars when you have upcoming dates

### Notes (`/notes`)

Scratchpad with tags: Ideas, Bookmarks, Exam, DevOps. Filter by tag. DevOps / code-looking notes use a mono body.

### Profile (`/profile`)

- Display name (used on the daily PDF)
- Counts: tasks, habits, classes, exams, notes, focus sessions
- **Reminders**: enable after allowing notifications; toggle class / exam / overdue; class lead time 5 / 10 / 15 / 30 minutes; send a test ping
- Appearance: light / dark (this device)
- Pomodoro and break minutes
- Sign out

On iPad / iPhone, add TaskyPulse to the **Home Screen** first. Safari tabs can suspend timers, so class reminders are most reliable as an installed PWA.

### Today’s PDF

Sidebar **Today’s PDF**, More → **Print today’s plan**, or the document icon in the header.

One A4 page:

- TaskyPulse logo and name
- Your display name and email
- That day’s date
- **Left:** today’s due tasks, then habits (done + streak)
- **Right:** today’s classes, then the time schedule (with done checks)

Allow the print popup, then Save as PDF. If the logo is missing, wait a moment and print again so the image can load.

### Search

`⌘K` / `Ctrl+K` opens the command palette. It searches tasks, notes, habits, classes, and exams.

---

## Status signals

| Status | Signal |
| --- | --- |
| To do | White |
| In progress | Yellow |
| Done | Green |

Same chip on lists, the task sheet, and kanban column titles.

---

## Data

Firebase **Email/Password** + **Firestore**. Each user only reads and writes `users/{theirUid}/**` (`firestore.rules`).

Typical subcollections:

| Path | Contents |
| --- | --- |
| `users/{uid}/tasks` | Tasks (status, list, priority, due date, tags, subtasks, recurrence, pomodoros) |
| `users/{uid}/habits` | Habits and per-day completions |
| `users/{uid}/notes` | Notes |
| `users/{uid}/days` | Per-date Big 3 + schedule slots (including done) |
| `users/{uid}/sessions` | Focus sessions |
| `users/{uid}/classes` | University classes |
| `users/{uid}/deadlines` | Exams / assignments (`classId`, syllabus, date, kind) |
| `users/{uid}/settings/app` | Pomodoro lengths, reminder toggles (theme is **not** applied from the cloud) |

Theme key: `localStorage.taskpulse-theme`. Do not commit `.env`.

---

## Stack

Vite, React 19, TypeScript, Tailwind CSS v4, React Router, Firebase JS SDK, Lucide icons, `vite-plugin-pwa` (installable, skip waiting / claim clients).

---

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Put your Firebase **web app** keys in `.env`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

In the Firebase console:

1. Enable **Authentication → Email/Password**
2. Create a **Firestore** database
3. Deploy `firestore.rules` so only `request.auth.uid == userId` can access `users/{userId}/{document=**}`

Restart `npm run dev` after changing `.env`.

### Scripts

```bash
npm run dev      # Vite
npm run build    # tsc -b && vite build
npm run preview  # serve dist
npm run lint     # oxlint
```

---

## Deploy (Netlify)

Connect the GitHub repo.

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Environment | the same `VITE_FIREBASE_*` keys as local `.env` |

After a deploy, hard-refresh or reopen the installed PWA so the new service worker can take over.

Install from the browser (Add to Home Screen) for the app icon and more reliable reminders.
