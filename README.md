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

## First launch

The first time Keep opens with nothing in it, it asks you to bring in a month of memories: **Choose photos** opens the phone's own photo picker (a web app cannot read the library silently). Each photo is filed on the day it was taken (EXIF date, falling back to the file's date) and keeps its location if the photo carries one, so it shows up on the map. Up to 300 photos per go; photos already kept are skipped. Profile → Import photos runs the same flow again. On iPhone, location is only included if you allow it in the picker's Options.

## Updates

Every deploy changes the app's version. An installed Keep checks for a new one when you open it, when it comes back to the front, and hourly while open. When one is ready it shows **Update available**; tap **Update** and the app swaps to the new version and reloads. **Pull to refresh:** drag down from the top of the calendar (or from the header) and let go; the page follows with rubber-band resistance, a ring fills and spins, and Keep looks for a new version. A new one is applied right away, otherwise the calendar just refreshes. Profile → Updates → **Check** looks on demand, and **Hard refresh** clears the cached copy and loads the app fresh. Your memories are never touched by either. Updates arrive as an in-app banner; real push notifications while the app is closed would need a push server, which Keep does not have.

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

**Street view.** When a place has a photo with someone tagged in it, its card gets a **Street view** button. It opens the real street at the photo's coordinates (Street View panorama), with a 3D avatar of each tagged person standing in it in their saved pose. The avatars are anchored to a lat/lng, so they stay on the ground as you look around or step along the street. "Stand here" re-places the group in front of you; the pose buttons change everyone's pose. It needs the Maps JavaScript API (Street View is part of it) and a place with Street View coverage within 80 m. Alignment of the 3D layer with the panorama uses Street View's heading, pitch and zoom; it is approximate.

## App Check (optional)

[Firebase App Check](https://firebase.google.com/docs/app-check) makes Maps Platform reject traffic that doesn't come from this app. Google currently enforces it for **Places API (New)** only; Keep loads maps and markers, not Places, so enforcement would not block anything yet. It is wired in for when Places is added.

1. Create a Firebase project for the same Google Cloud project, register a web app, and set up App Check with reCAPTCHA Enterprise (a site key for your domain).
2. Add repository secrets `FIREBASE_CONFIG` (the config object as JSON) and `RECAPTCHA_KEY`, then redeploy.
3. Leave enforcement off at first. Watch the App Check metrics in the Firebase console until nearly all requests are verified, then enforce.

Local or CI debugging: open the site with `?appcheck-debug` (the SDK prints a debug token to the console) or `?appcheck-debug=<token>` for one you registered in the Firebase console. If Firebase can't be reached, the map still loads without a token. reCAPTCHA Enterprise is free up to 10,000 assessments a month.

## Avatars

Meta and Instagram avatars cannot be used outside Meta's own apps (the Meta Avatars SDK is Unity/VR only, and Instagram's consumer API is closed), so Keep has its own.

- **Style editor.** In Re-live, tap **Style** to change a person's skin tone, hair style and colour, top (tee or hoodie) and colour, pants and glasses. The avatar updates as you tap. Looks are saved in this browser and included in Back up / Restore. People you never style keep the look their name gave them.
- **Your own avatar file.** In the same panel, **Import .glb file** uses any `.glb` (or `.vrm`) avatar: VRoid Studio, Avaturn, Blender, or other exports **without Draco or Meshopt compression**, up to 40 MB. It is sized to a person, stood on the ground, and its arms are swung down from a T-pose. It stands in Re-live and Street View but does not sit or wave (that needs the built-in figure). The file stays on this phone, in its own storage, and is not part of Back up. Remove it any time to go back to the built-in figure.

## Profile photo

Profile → tap the circle at the top to choose a photo. It is cropped to a square, kept on this phone, and shown in the header button in place of the letter. Remove photo brings the letter back. Back up carries it and Restore puts it back if you have none.

## Camera

Drag up or down on the viewfinder or on the red button to zoom (up zooms in), or pinch. The zoom is digital, so it applies to photos and to recorded video on every phone, and a pill shows the level (up to 5x). In Video, tap the red button to start and again to stop; the microphone is used if you allow it, otherwise the video is silent.

## Photo viewer

Swipe left and right to move between a day's photos. Swipe down to close: the photo follows your finger, shrinks a little, and the page behind fades in; let go past a short distance (or flick) and it closes, otherwise it springs back. There is no close button. A single photo also closes with a tap, and Escape works on desktop.

## Deleting

Press and hold a memory to delete it: a photo in the viewer (swipe to it, then hold), a single photo or a note in a day. A small menu offers a red **Delete** button and a cancel icon. There is no list of delete buttons in the day sheet any more.

## Data and limits

- Memories are stored per browser/device. Clearing site data deletes them, so back up. The app asks the browser for persistent storage.
- No sync across devices yet; use Back up and Restore.
- Videos you record (or pick from your library, up to 300 MB) are kept as real video, with sound, next to a still. Videos play in the photo viewer, in the same swipe strip as the photos: swipe to one and it starts, tap to pause or play, and a speaker button turns sound on if the phone started it muted. A video fades at the edges like a photo does. Swiping away pauses it. A single-memory view, search answers, revisits and Re-live journals show the video the same way: soft faded edges and no black bars, tap to play or pause, speaker button for sound. Older videos that kept only a still show as a still. Back up saves the still and length but not the video file itself, so a restored video shows as a still. Voice notes keep their length but not the audio.
- Search is keyword matching.
