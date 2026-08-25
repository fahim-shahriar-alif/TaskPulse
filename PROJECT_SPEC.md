# 📋 Project Specification: Personal Task & Productivity Suite (TaskPulse Pro)

## 📌 1. Project Overview & Vision
A sleek, modern, offline-first personal productivity and task management web application (desktop & tablet-optimized for Mac / iPad). The app balances high-level goal tracking with granular daily execution (time-blocking, Kanban board, habit tracking, and quick scratchpad).

---

## 🏗️ 2. Core Architecture & Tech Stack
* **Frontend:** React / Next.js / Vanilla HTML5 + Tailwind CSS (v3/v4) with Dark Mode as default.
* **Icons & Fonts:** Lucide Icons / Heroicons, Google Fonts (`Plus Jakarta Sans` for UI, `Fira Code` for tags/metrics).
* **State & Persistence:** Offline-first architecture using `localStorage` / IndexedDB with one-click JSON Backup/Restore functionality.
* **Design Philosophy:** Clean glassmorphism (`bg-slate-950` / `bg-slate-900` palette with indigo/emerald/amber accents), zero UI clutter, responsive mobile/tablet touch targets.

---

## 🚀 3. Key Functional Modules & Features

### 1. "My Day" (Focus & Execution Dashboard)
* **Live Completion Ring:** Real-time circular progress indicator calculating the percentage of completed tasks for the current date.
* **Quick Task Bar:** Single-line input field to add tasks on the fly (hitting `Enter` creates the task in the list).
* **Big 3 Non-Negotiables:** Dedicated card to capture the top 3 highest-impact goals for the day.
* **Habit Quick-Check:** Inline toggle to mark off core daily habits without leaving the dashboard.

### 2. Task & Project Management (List & Kanban Views)
* **Dual View Mode:**
  * **List View:** Grouped, searchable, and filterable by Project (`#Work`, `#Study`, `#Personal`, `#Health`), Priority, and Due Date.
  * **Kanban Board View:** Drag-and-drop or dropdown status movement across 3 columns (`To Do`, `In Progress`, `Completed`).
* **Task Attributes:**
  * `id`: Unique identifier (timestamp / UUID)
  * `title`: String (required)
  * `project`: String (custom category/tag)
  * `priority`: Enum (`high` / `medium` / `low`) with colored badge indicators
  * `dueDate`: Date string
  * `status`: Enum (`todo` / `inprog` / `completed`)
  * `done`: Boolean
  * `notes`: Multiline string for subtasks or references

### 3. Daily 24-Hour Time-Block Scheduler
* Hourly interactive timeline (e.g., `07:30 AM` to `11:30 PM`).
* Editable inline activity slots allowing dynamic planning of study blocks, workouts, and focus sprints.
* "Reset Schedule" action to restore default recommended routines.

### 4. Daily Habit Tracker
* Habit cards tracking daily consistency.
* Single-click toggle button (`Mark Complete` / `✓ Done Today`) with persistent streak tracking.
* Ability to add/delete custom habits dynamically via modal.

### 5. Quick Notes & Scratchpad
* Card-based idea repository for meeting minutes, code snippets, command cheatsheets, or random ideas.
* Tagging system (e.g., `#Ideas`, `#Bookmarks`, `#Exam`, `#DevOps`).
* Monospace code-block rendering for commands/snippets.

### 6. Data Management
* **Auto-Save:** Real-time synchronization to browser storage on every state change.
* **Backup / Export:** Single-click export of state to a downloadable timestamped JSON file (`taskpulse_backup_YYYY-MM-DD.json`).
* **Reset / Clear All:** Modal confirmation before purging application state.

---

## 🎯 4. Instructions for Cursor
1. Keep the UI ultra-modern, minimal, and dark-themed (`slate-950` background).
2. Ensure state updates are reactive across all tabs (e.g., checking a task in "My Day" immediately reflects in "Tasks & Projects" and updates the progress ring).
3. Ensure the layout works seamlessly with both keyboard shortcuts (desktop) and touch/stylus inputs (iPad/Safari).
