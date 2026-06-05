# 📬 Echo-Box

A vintage-styled, real-time gifting web app where users send **Cassette Tapes**, **Mail**, and **Packages** to each other's personal boxes.

**Stack:** React + Vite (frontend) · Node.js + Express (backend) · Firebase Auth + Storage · Supabase (PostgreSQL)

---

## Project structure

```
echo-box/
├── firebase.json          ← Firebase Hosting config (SPA)
├── .firebaserc            ← Firebase project link
├── render.yaml            ← Render.com deployment config (backend)
├── .gitignore
│
├── frontend/              ← React + Vite app
│   ├── .env.example       ← copy → .env, fill in values
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── firebase.js
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       ├── context/
│       ├── i18n/
│       ├── pages/
│       └── services/
│
└── backend/               ← Express API
    ├── .env.example       ← copy → .env, fill in values
    ├── server.js
    ├── supabase-schema.sql
    └── src/
        ├── firebase-admin.js
        ├── db/supabase.js
        ├── middleware/auth.js
        └── routes/
```

---

## 1 · Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Frontend build + backend runtime |
| Firebase CLI | latest | Deploy to Firebase Hosting |
| Git | any | Source control |

```bash
npm install -g firebase-tools
firebase login
```

---

## 2 · Database setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New query**
3. Paste and run `backend/supabase-schema.sql`
4. Copy your **Project URL** and **service_role** key from  
   *Project Settings → API*

---

## 3 · Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication → Google** sign-in
3. Enable **Storage** (default rules are fine for now)
4. Under *Project Settings → Your apps*, register a **Web app** and copy the config
5. Under *Project Settings → Service Accounts*, click **Generate new private key** and save the JSON

---

## 4 · Local development

### Backend
```bash
cd backend
cp .env.example .env        # fill in all values
npm install
npm run dev                 # starts on :4000 with nodemon
```

### Frontend
```bash
cd frontend
cp .env.example .env        # fill in Firebase config
                            # set VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # starts on :5173, proxies /api → :4000
```

---

## 5 · Deploy backend (Render)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your repo; Render will detect `render.yaml` automatically  
   *(or set Root Directory: `backend`, Build: `npm install`, Start: `node server.js`)*
4. Add all environment variables from `backend/.env.example` in the Render dashboard
5. Set `FRONTEND_URL` to your Firebase Hosting URL (e.g. `https://echo-boxx.web.app`)
6. Deploy — note your Render service URL (e.g. `https://echo-box-api.onrender.com`)

---

## 6 · Deploy frontend (Firebase Hosting)

1. In `frontend/.env`, set:
   ```
   VITE_API_URL=https://echo-box-api.onrender.com   # your Render URL
   ```
2. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
3. From the **repo root** (`echo-box/`), deploy:
   ```bash
   firebase deploy --only hosting
   ```
4. Your app is live at `https://echo-boxx.web.app` 🎉

> **Re-deploy after changes:**  
> `cd frontend && npm run build && cd .. && firebase deploy --only hosting`

---

## 7 · Firebase Storage rules (recommended)

In Firebase Console → Storage → Rules, replace the default with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{uid}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /audio/{uid}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 8 · Environment variable reference

### `frontend/.env`

| Variable | Where to find it |
|----------|-----------------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | same |
| `VITE_FIREBASE_PROJECT_ID` | same |
| `VITE_FIREBASE_STORAGE_BUCKET` | same |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | same |
| `VITE_FIREBASE_APP_ID` | same |
| `VITE_API_URL` | Your Render/Railway/Fly.io backend URL |

### `backend/.env`

| Variable | Where to find it |
|----------|-----------------|
| `FRONTEND_URL` | Your Firebase Hosting URL |
| `FIREBASE_PROJECT_ID` | Firebase service account JSON |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account JSON |
| `FIREBASE_PRIVATE_KEY` | Firebase service account JSON |
| `FIREBASE_STORAGE_BUCKET` | Firebase Console → Storage |
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API (service_role) |
