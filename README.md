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

A hands-on intro shows once, then the photo import below: confetti from the logo, drag a photo onto the calendar, tap a question and watch Keep answer (or say nothing matches), pick a pose for an avatar, and press and hold to lock it in. Phones buzz on each step. Open the site with `?intro` to see it again. Screen recordings: `docs/videos/onboarding.mp4` (the first-time experience: opening the app, the intro, importing a month of photos, the first calendar and day) and `docs/videos/screens.mp4` (calendar, a day, search, Insights, Places, Profile).

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

## Google tag

Real (non-demo) builds include Google's tag with the site's own ID, `G-LR0ZL46FF6` (a tag ID is public, like the page source it sits in). Set `GTAG_ID` to use a different one, or `GTAG_ID=off` to build without it. It is never added to the demo build, and it does nothing on `localhost`. The tag reports page views only: the address is trimmed to the page path (no query or login codes), the referrer is blanked, and Google signals and ad personalization are off. Memories, names, photos and Instagram details are never sent. Because Google sees visits, mention it in a privacy policy if you publish the app; the onboarding line "Nothing uploaded" still holds for memories.

## Local setup

```bash
cp .env.example .env   # fill in what you have; .env is git-ignored
KEEP_DEMO=1 python3 build.py && python3 -m http.server -d dist 8000
```

Open `http://localhost:8000/` (add `?intro` to replay the intro). `LLM_API_KEY` is read by nothing in the web app on purpose: anything built into a static site is public, so a key like that belongs in a worker secret (`wrangler secret put`), not in `.env` for the client build.

## Deploying on Render

`render.yaml` describes two services: the static site and `keep-instagram` (the sign-in helper, `worker/server.js`). Create them from the Blueprint, then in the Render dashboard set `IG_APP_ID` on both and `IG_APP_SECRET` on the helper (both come from your Meta app: Instagram API with Instagram Login; add `https://keepxmeta.onrender.com/` as the OAuth redirect URI). Until they are set, onboarding offers to type an Instagram handle instead. Rebuild the site after setting `IG_APP_ID`.

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

## Profile

Profile → tap the circle to choose a photo (cropped to a square, kept on this phone, shown in the header button), and type your name; the header shows your initial until you add a photo. Everyday items are up top (Appearance, Insights, Friends, People, Import photos, Back up, Restore); Revisits, Updates, Hard refresh, Install app and Google Maps are under **More settings**.

**Instagram.** Instagram does not let apps sign in to an account and read it, so Keep cannot pull your details automatically. **Link Instagram** saves your handle and shows a button to your profile. **Import from your Instagram download** reads `personal_information.json` (name, username, bio) and a profile photo from Instagram's own download, on the phone, and fills the profile in one go. Your details are included in Back up and Restore.

## Day journal

A day opens as a timeline: a line down the left with a dot for each moment, and **Add to this day** at the end of the line. Whatever you keep from there lands on that day and appears on the line when you return.

## Camera

Drag up or down on the viewfinder or on the red button to zoom (up zooms in), or pinch. The zoom is digital, so it applies to photos and to recorded video on every phone, and a pill shows the level (up to 5x). In Video, tap the red button to start and again to stop; the microphone is used if you allow it, otherwise the video is silent.

## Photo viewer

Swipe left and right to move between a day's photos. Swipe down to close: the photo follows your finger, shrinks a little, and the page behind fades in; let go past a short distance (or flick) and it closes, otherwise it springs back. There is no close button. Escape works on desktop.

## Tagging who is in a photo

Tap a photo in the viewer to say who is in it: type a name (or tap one you have used before), pick the pose they were in, and Save. The photo then shows up in Re-live, where their avatar can stand in the same place, and its date line reads "with <name>". Tap again to change the name or Remove the tag. Videos and the demo sample memories cannot be tagged. A tap on empty space around a lone photo still closes the viewer.

## People: find someone in all your photos

Name someone and Keep quietly does the rest. There is nothing to confirm and no message about it.

1. Tap a photo in the viewer, type a name and Save. That is all you do.
2. In the background (only while the app is open and in front), Keep learns that face and tags the same person in your other photos. It also looks at photos you keep or import later. Tagged photos show "with Maya" in the date line and appear in Re-live; the tag card says "Tagged automatically" for ones Keep added, and **Remove** takes a wrong one off. A removed tag is never added back to that photo.
3. Keep only learns a face when it is unambiguous: a photo with exactly one face, or a face that two or more photos you tagged with that name share. In a group photo it cannot guess which face is yours, so tag them on a photo where they are alone, or tag a few group photos with them, or tap **Pick their face in a group photo** in the tag card to point them out.
4. A photo can hold several people: type a second, different name on an already-tagged photo to add them (the first stays the main name Re-live uses).
5. **Profile → People** lists who Keep has learned, lets you search all photos again for someone and review the matches (borderline ones show as "Maybe"), and **Forget all face data** wipes it (names on photos stay).

**Private by design.** The face library and models ship inside the app (`public/face/`, about 8 MB, MIT-licensed `@vladmandic/face-api`), so it all runs on the phone and nothing is uploaded. A face is stored as 128 numbers, up to 12 varied ones per person, in this browser only. The models download once, quietly, the first time Keep needs them (skipped when Data Saver is on), then the app caches them.

**How careful it is.** It compares faces as distances (the same person is usually under 0.25 and different people over 0.5 in testing). In the background Keep tags only under 0.42, and only when the face is clearly closer to one person than another; the Profile → People review shows 0.45 to 0.5 as "Maybe". It works best on clear, front-facing faces; sunglasses, profiles, tiny faces in a crowd and children whose looks change are harder. On a phone without graphics acceleration Keep checks only a few new photos per visit so the app stays responsive.

## Insights

Tap the chart icon in the header (or Profile → Insights) for a page that shows what you keep and when, counted on this phone from your memories. One range row at the top (30 days, 90 days, 12 months, All time) scopes everything below it.

- **Headline:** how many memories you kept in the range and on how many days, then your current streak, longest streak and busiest day (streaks count every day with a memory, all time).
- **Activity:** thin columns per day, week or month depending on the range. **What you keep:** by type. **Busiest weekday**, with the top day highlighted. **Time of day.** **People** in your photos (from your tags). **Places:** photos with a location and how many different places. **Words you use** in notes and captions. **A year ago today**, with a button to open that day.
- Tap (or hover, or focus) a bar for its exact number, and switch any card to a **Table** view of the same numbers. The page has Meta's light insights look: a light gray background, white rounded cards, a soft pastel headline card, light-blue bars with the peak (busiest week, weekday, type and so on) in solid Meta blue, and pastel word chips; dark mode uses a muted equivalent. Names and words from your memories are shown as plain text.

## Friends

Tap the people icon in the header (or Profile → Friends) for a page of the people you know. Add a friend with a name, an optional photo and an Instagram username or profile link (tap the Instagram button on a row to open their profile). Tap a row to edit or delete (two taps). Friends are stored in this browser, included in Back up and Restore, and their names show up as suggestions when you tag a photo.

**Instagram.** Instagram closed its friends and followers access for apps like this one (the Basic Display API ended on December 4, 2024, and the replacement is for business accounts only), so Keep cannot sync with your account. Instead, **From Instagram** imports Instagram's own export: in Instagram go to Settings → Accounts Center → Your information and permissions → Download your information, choose Followers and following in JSON, then pick `followers_1.json` and `following.json` (the HTML files work too). Keep reads them on the phone, lists the accounts (mutuals first, with search), and adds the ones you tick. The export only has usernames, so rename people afterwards.

## Invite friends

Profile → **Invite friends**. **Share invite** opens the share sheet with a short message and link; each friend with an Instagram handle has an **Invite** button that copies the message and opens an Instagram chat with them. If you linked Instagram, the link carries `?ref=<your handle>` so whoever opens it can add you as a friend in one tap. Keep has no server, so it cannot see who has installed it or who is on Instagram right now.

## Deleting

Press and hold a memory to delete it: a photo in the viewer (swipe to it, then hold), a single photo or a note in a day. A small menu offers a red **Delete** button and a cancel icon. There is no list of delete buttons in the day sheet any more.

## Data and limits

- Memories are stored per browser/device. Clearing site data deletes them, so back up. The app asks the browser for persistent storage.
- No sync across devices yet; use Back up and Restore.
- Videos you record (or pick from your library, up to 300 MB) are kept as real video, with sound, next to a still. Videos play in the photo viewer, in the same swipe strip as the photos: swipe to one and it starts, tap to pause or play, and the speaker button turns sound on or off. A video looks like a kept photo: centered, sized to its own shape, soft faded edges, caption and date below. The speaker button sits on top of the picture (top right). Swiping away pauses it. A single-memory view, search answers, revisits and Re-live journals show the video the same way: soft faded edges and no black bars, tap to play or pause, speaker button for sound. Older videos that kept only a still show as a still. Back up saves the still and length but not the video file itself, so a restored video shows as a still. Voice notes keep their length but not the audio.
- Search is keyword matching.
