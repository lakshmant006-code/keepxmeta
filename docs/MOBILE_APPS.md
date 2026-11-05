# Keep for iPhone and Android

The phone apps are the same pages as the web app, wrapped in a small native shell so they can ask for access to your photo library.
Keep never changes or deletes anything in Photos or your gallery, and nothing leaves the phone.
The web app on Render stays as it is. People can keep using it in the browser, and the apps add the photo library on top.

| | iPhone | Android |
|---|---|---|
| Reads the library with | the `@capacitor-community/media` plugin | Keep's own plugin in `plugins/keep-photos` |
| You need | a Mac with Xcode, and an Apple ID | Android Studio (Windows, Mac or Linux) |
| Install on your own phone | free Apple ID: 7 days at a time. Paid ($99 a year): TestFlight and the App Store | an APK file, free. Play Store: $25 once |

## Common setup

```sh
npm install
python3 build.py            # the real app. KEEP_DEMO=1 python3 build.py gives sample data
```

## iPhone

```sh
npx cap add ios
npx cap sync ios
npx @capacitor/assets generate --ios   # app icon from assets/icon-only.png
npx cap open ios                       # opens Xcode
```

In Xcode:

1. Click **App** in the left list, then **Signing & Capabilities**. Choose your Team (your Apple ID) and keep the bundle id `com.keepxmeta.keep`, or change it.
2. Open `App/App/Info.plist` and add these keys (the text is what the iPhone shows when it asks):
   - `NSPhotoLibraryUsageDescription`: Keep reads your photos to file them on the day they were taken. Nothing leaves your phone.
   - `NSPhotoLibraryAddUsageDescription`: Keep can save photos you take to your library.
   - `NSCameraUsageDescription`: Keep uses the camera to take photos and video.
   - `NSMicrophoneUsageDescription`: Keep uses the microphone for voice notes and video.
   - `NSLocationWhenInUseUsageDescription`: Keep marks where a photo was taken and nudges you when you walk past a place.
   - `NSSpeechRecognitionUsageDescription`: Keep writes down what you say.
3. Plug in your iPhone, pick it at the top, press Run. If the phone says the developer is not trusted: Settings > General > VPN & Device Management > trust your Apple ID.

## Android

```sh
npx cap add android
npx cap sync android
npx @capacitor/assets generate --android   # app icon from assets/icon-only.png
npx cap open android                       # opens Android Studio
```

In Android Studio:

1. Let Gradle finish syncing (first time takes a few minutes).
2. Open `android/app/src/main/AndroidManifest.xml` and add, inside `<manifest>` and above `<application>`:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   ```
   The photo permissions (`READ_MEDIA_IMAGES`, `ACCESS_MEDIA_LOCATION`, and `READ_EXTERNAL_STORAGE` for Android 12 and below) come from the Keep plugin automatically.
3. Plug in your phone with USB debugging on (Settings > About phone > tap Build number 7 times, then Developer options), pick it at the top, press Run.
4. To get a file you can send to others: **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The file is in `android/app/build/outputs/apk/debug/app-debug.apk`. They open it on their phone and allow installing from that source.

On Android 14 and newer the phone offers "Select photos" as well as "Allow all". Keep reads whichever the person chooses.

## Using it (both phones)

Open Keep, then Profile > **Photos on this phone**. Turn on **Keep in sync**, pick how far back to read (30 days, 3 months, a year or everything) and allow Photos when asked. New photos are picked up each time you open Keep, and **Sync now** does it on demand. Photos already in Keep are skipped.

## Updating the apps

Run `npm run sync` after changing the web code, then press Run again.
To get changes without rebuilding, point the app at your site instead of the bundled files: add `"server": { "url": "https://keepxmeta.onrender.com" }` to `capacitor.config.json` and run `npx cap sync`. The trade-off is that the app then needs a connection to open.

## Limits

- Keep reads photos only while it is open. Neither phone lets a web page run in the background, so photos arrive when you open Keep, not while it is closed.
- Photos come in as small copies (about 900 px) to keep storage light. Videos are not read yet.
- The first read of a very large library can take a few minutes. A shorter range is faster.
- Both apps were written without a Mac or an Android phone to try them on, so neither has been built or run on a device. The Android plugin compiles against stand-in classes but has not been built by Gradle. Expect to fix small things in the first run.
