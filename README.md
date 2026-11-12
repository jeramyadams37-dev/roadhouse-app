# RoadHouse — Android APK

RoadHouse as an installable Android app, set up the same way as
AutoHustle v10: a [Capacitor](https://capacitorjs.com) shell
(app ID `com.atothei.roadhouse`) that GitHub Actions builds into an
APK. No Android Studio or SDK needed on the phone — GitHub does the
building.

**How it works:** RoadHouse is a standalone offline app. The whole
web app is bundled into the APK (the `www/` folder below), and
everything the driver logs — shifts, miles, expenses, board posts,
chat, pre-shift checks, profile — is saved on the phone, in the
app's own storage. There is no hosted backend and no live address
to set: the APK works fully offline. Sign-in is required and is
handled on the phone too — each driver creates an account (driver
name + password, stored only as a salted hash) and gets their own
log, posts, and taxes; signing out locks the app back to the
sign-in screen. The only network
call the app ever makes is the optional Timeline place-address
lookup against OpenStreetMap, which quietly falls back to showing
coordinates when there's no connection.

Because the data lives on the phone, two habits matter:

- **Back up from inside the app.** Profile → "Your data, on this
  device" → Export backup saves a single JSON file. Keep one
  somewhere safe (for example your `gdrive` rclone remote) now and
  then — clearing the app's storage or uninstalling takes the data
  with it, and the backup file is how you get it back (Restore a
  backup, same section) or move it to a new phone.
- **Updates keep data only when the signature stays the same.** An
  APK update signed with the same keystore installs over the old
  one and the on-device data carries over. Switching from the debug
  APK to a signed release APK (or the reverse) uses a different
  signature, so Android makes you uninstall first — export a backup
  before you switch, then restore it in the new install.

## Fast path: the package + build script

RoadHouse itself (Profile → "Android app (APK)") offers two
downloads that package this whole setup:

- **`roadhouse-apk.zip`** — this `apk/` folder, complete
  (`capacitor.config.ts`, `package.json`, `www/` with the built app,
  `.github/workflows/build-apk.yml`, this README), plus the build
  script below at the top level of the zip.
- **`roadhouse-apk-build.sh`** — a plain-text Termux script. With
  both files in Downloads, running
  `bash ~/storage/shared/Download/roadhouse-apk-build.sh` does the
  whole job: it unzips the package, pushes the `apk/` folder to
  GitHub as its own repo, adds the four signing secrets, runs the
  **Build RoadHouse APK** workflow, and downloads and opens the
  finished APK for install.

The script reads `ROADHOUSE_KEYSTORE_BASE64` from
`~/roadhouse-keystore-b64.txt` (it makes that file from
`~/roadhouse-release.keystore` if it's missing) and asks for the two
passwords at hidden prompts. The package and the script contain no
keystore and no password — nothing secret ever goes in them. The
manual steps below are the same flow, for doing it by hand.

## One-time setup

1. **Make a GitHub repo for the app** (for example `roadhouse-app`
   under your account) and push the *contents of this `apk/` folder*
   as the repo root — `package.json`, `capacitor.config.ts`, `www/`,
   and `.github/` should sit at the top level of the repo.
2. **Check the app bundle in `www/`.** The built RoadHouse web app —
   an `index.html` plus an `assets/` folder, the artifact's client
   build output — already sits in this folder's `www/`, ready to
   package. Whenever you want the APK to carry a newer version of
   the app, copy the newest bundle into `www/` the same way before
   you push; the app inside the APK only changes when you do.
3. **(Optional, for a signed release APK) Create your keystore.**
   In Termux:

   ```
   pkg install -y openjdk-17
   keytool -genkeypair -v -keystore ~/roadhouse-release.keystore -alias roadhouse -keyalg RSA -keysize 2048 -validity 10000
   base64 -w 0 ~/roadhouse-release.keystore > ~/roadhouse-keystore-b64.txt
   ```

   Answer the keytool prompts and remember the password you choose —
   it can't be recovered, and every future update of the app must be
   signed with this same keystore. Then, in the GitHub repo, go to
   **Settings → Secrets and variables → Actions** and add four
   secrets:

   - `ROADHOUSE_KEYSTORE_BASE64` — the full contents of
     `~/roadhouse-keystore-b64.txt`
   - `ROADHOUSE_KEYSTORE_PASSWORD` — the keystore password
   - `ROADHOUSE_KEY_ALIAS` — `roadhouse`
   - `ROADHOUSE_KEY_PASSWORD` — the key password (same as the
     keystore password if you pressed Enter at that prompt)

   Keep the keystore file backed up somewhere safe (for example your
   `gdrive` rclone remote). Never paste the keystore, its base64 text,
   or its passwords into a chat.

   Skipping this step is fine to start: the workflow always builds a
   **debug APK** that installs and runs the same way.

## Build & install

1. In the GitHub repo, open the **Actions** tab, pick **Build
   RoadHouse APK**, and tap **Run workflow** (it also runs on every
   push to `main`).
2. When the run finishes, open it and download the artifact:
   `roadhouse-release-apk` if you set up signing, otherwise
   `roadhouse-debug-apk`. Unzip it to get the `.apk` file.
3. On the phone, open the APK and allow installing from your browser
   or Files app when Android asks. RoadHouse lands on the home screen
   like any other app — and from then on it runs entirely on the
   phone, online or off.

## Files

- `capacitor.config.ts` — app ID and name. No server URL: the app
  is bundled, not loaded from a host.
- `package.json` — Capacitor 6 dependencies and scripts.
- `www/` — the built RoadHouse web bundle (`index.html` +
  `assets/`) that gets packaged into the APK. Refresh it with a
  newer bundle when the app changes (setup step 2).
- `.github/workflows/build-apk.yml` — the GitHub Actions build:
  Node 20 + Java 17 + Android SDK, generates the Android project with
  Capacitor, builds the debug APK, and builds the signed release APK
  when the keystore secrets are present.
- The `android/` project is generated by Capacitor during the build
  (`npx cap add android`), so it isn't stored in the repo.
