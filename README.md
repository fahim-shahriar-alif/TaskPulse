# TaskPulse Pro

Offline-first personal task and productivity web app.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and paste your Firebase web app keys. Enable Email/Password authentication and Firestore in the Firebase console, then deploy `firestore.rules`.

Netlify: connect this GitHub repo, set build command `npm run build`, publish directory `dist`, and add the same `VITE_FIREBASE_*` environment variables.

## Build

```bash
npm run build
```
