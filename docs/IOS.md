# Keep for iPhone

The iPhone app is the same pages as the web app, wrapped in a small native shell so it can ask for access to your photo library.
Keep never changes or deletes anything in Photos, and nothing leaves the phone.

## What you need

- A Mac with Xcode (free from the App Store) and Node 20 or newer.
- An Apple ID. A free one installs the app on your own iPhone for 7 days at a time. A paid developer account (about $99 a year) is needed for TestFlight or the App Store.

## One-time setup

```sh
npm install
python3 build.py            # or KEEP_DEMO=1 python3 build.py for sample data
npx cap add ios             # creates the ios/ folder
npx cap sync ios
npx @capacitor/assets generate --ios   # app icon from assets/icon-only.png
npx cap open ios            # opens Xcode
```

In Xcode:

1. Click **App** in the left list, then **Signing & Capabilities**. Choose your Team (your Apple ID) and keep the bundle id `com.keepxmeta.keep`, or change it to your own.
2. Open `App/App/Info.plist` and add these keys (the text is what the iPhone shows when it asks):
   - `NSPhotoLibraryUsageDescription`: Keep reads your photos to file them on the day they were taken. Nothing leaves your phone.
   - `NSPhotoLibraryAddUsageDescription`: Keep can save photos you take to your library.
   - `NSCameraUsageDescription`: Keep uses the camera to take photos and video.
   - `NSMicrophoneUsageDescription`: Keep uses the microphone for voice notes and video.
   - `NSLocationWhenInUseUsageDescription`: Keep marks where a photo was taken and nudges you when you walk past a place.
   - `NSSpeechRecognitionUsageDescription`: Keep writes down what you say.
3. Plug in your iPhone, pick it at the top, press Run. On the phone, if it says the developer is not trusted: Settings > General > VPN & Device Management > trust your Apple ID.

## Using it

Open Keep, then Profile > **Photos on this phone**. Turn on **Keep in sync**, pick how far back to read (30 days, 3 months, a year or everything) and allow Photos when asked. New photos are picked up each time you open Keep, and **Sync now** does it on demand. Photos already in Keep are skipped.

## Updating the app

Run `npm run sync` after changing the web code, then press Run in Xcode again.
To get changes without rebuilding, you can point the app at your site instead of the bundled files: add `"server": { "url": "https://keepxmeta.onrender.com" }` to `capacitor.config.json` and run `npx cap sync ios`. The trade-off is that the app then needs a connection to open.

## Limits

- Keep reads photos only while it is open. iPhone does not let a web page run in the background, so photos arrive when you open Keep, not while it is closed.
- Photos are read as small copies (about 900 px) to keep storage light. Videos are not read yet.
- Reading a very large library the first time can take a few minutes. A shorter range is faster.
- I wrote this without a Mac, so it has not been built or run on an iPhone. Expect to fix small things in the first run.
