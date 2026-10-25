# Keep

Drop anything worth keeping (photo, video, voice, note, quote, person, place, file) into one calendar, then ask for it later. Search answers show the original memory, and say so when nothing matches.

A single static web app, installable on a phone (PWA). Everything you keep is stored on the device in IndexedDB, photos included. There is no server and no account.

## Run it as a real app

1. **Deploy** (GitHub Pages, one time)
   - Repo Settings → Pages → Source: **GitHub Actions**.
   - Repo Settings → Secrets and variables → Actions → New repository secret: `GM_KEY` = your Google Maps API key.
   - Push to `main` (or run the "Deploy Keep" workflow). The site appears at `https://<user>.github.io/Keep/`.
2. **Install on your phone**: open the site in Safari (Share → Add to Home Screen) or Chrome (Install app). Allow camera, location and motion when asked.
3. **Back up** from Profile → Back up now and then; Restore loads it on a new phone.

## Environment

All configuration is read at build time from environment variables or a local `.env` (see `.env.example`). Nothing secret is committed.

| Variable | What it does |
| --- | --- |
| `GM_KEY` | Google Maps JavaScript API key. Restrict it to your site's HTTP referrer (`https://<user>.github.io/*`) in Google Cloud: it is visible in the served page, as every browser key is. |
| `KEEP_DEMO` | `1` builds the sample-data demo (fixed date, sample photos, simulated keyboard). Default is the real app. |

| `FIREBASE_CONFIG` | Optional. Firebase web app config as JSON, for App Check (below). |
| `RECAPTCHA_KEY` | Optional. reCAPTCHA Enterprise site key for App Check. |

Local build: `cp .env.example .env`, fill it in, `python3 build.py`, serve `dist/` over HTTPS or localhost (camera, location and the service worker need a secure origin).

A key saved in Profile → Google Maps (or opened once via `https://<site>/#gmkey=KEY`) overrides the built-in one on that device.

## What's inside

- `src/app.src.html` the app; `src/ar.js` + `src/ar.css` Re-live; `src/maps.js` + `src/maps.css` Places; `src/vendor/three.min.js` three.js r160; `src/sw.js` offline service worker.
- `public/` manifest and icons, copied into `dist/`.
- `build.py` assembles `dist/`. `.github/workflows/pages.yml` builds and deploys it.

## Re-live: the person who isn't there any more

Tag a photo with who is in it, their pose (sit, stand, wave, walk) and the spot where they were (tap the photo). Later, tap the cube icon and point the camera at the same place:

- The camera frame is compared with your tagged photos (16x16 gradient hash plus coarse colour). With a location fix, only memories kept within 200 m are candidates. On a match, a 3D avatar of that person appears in the same pose at the same spot.
- Drag to turn the avatar; on a phone, tilting pans the view (rotation only).
- A glass card lists every journal kept about that memory. Add a line, or tap the shutter to keep the scene with the avatar as a new photo.
- No camera, or somewhere else: pick a memory from the chips and the stored photo stands in for the scene.

Limits: the avatar is generated from the name, not from the real person; pose and spot are what you tag, not detected. Matching is a fingerprint, so it needs a similar view of the same place; it does not track you as you walk (that needs ARKit/ARCore or WebXR).

## Places (Google Maps)

The pin icon shows photos kept with a location as markers; tap one to open the day, see the person there, or get directions. The locate button shows what you kept within 200 m. Photos taken with the in-app camera save their location; library photos do not. Without a key, Places falls back to a list with "Open in Maps" links.

## App Check (optional)

[Firebase App Check](https://firebase.google.com/docs/app-check) makes Maps Platform reject traffic that doesn't come from this app. Google currently enforces it for **Places API (New)** only; Keep loads maps and markers, not Places, so enforcement would not block anything yet. It is wired in for when Places is added.

1. Create a Firebase project for the same Google Cloud project, register a web app, and set up App Check with reCAPTCHA Enterprise (a site key for your domain).
2. Add repository secrets `FIREBASE_CONFIG` (the config object as JSON) and `RECAPTCHA_KEY`, then redeploy.
3. Leave enforcement off at first. Watch the App Check metrics in the Firebase console until nearly all requests are verified, then enforce.

Local or CI debugging: open the site with `?appcheck-debug` (the SDK prints a debug token to the console) or `?appcheck-debug=<token>` for one you registered in the Firebase console. If Firebase can't be reached, the map still loads without a token. reCAPTCHA Enterprise is free up to 10,000 assessments a month.

## Data and limits

- Memories are stored per browser/device. Clearing site data deletes them, so back up. The app asks the browser for persistent storage.
- No sync across devices yet; use Back up and Restore.
- Voice notes and videos keep a still image and duration, not the audio or video itself.
- Search is keyword matching.
