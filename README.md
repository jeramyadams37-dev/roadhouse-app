# RoadHouse — Android APK

RoadHouse as an installable Android app, set up the same way as
AutoHustle v10: a [Capacitor](https://capacitorjs.com) shell
(app ID `com.atothei.roadhouse`) that GitHub Actions builds into an
APK. No Android Studio or SDK needed on the phone — GitHub does the
building.

**How it works:** RoadHouse is a standalone app with one live
part. The whole web app is bundled into the APK (the `www/` folder
below), and everything private the driver logs — shifts, miles,
expenses, pre-shift checks, profile — is saved on the phone, in
the app's own storage, and works fully offline. Sign-in is handled
on the phone too — each driver creates an account (driver name +
password, stored only as a salted hash) and gets their own log and
taxes; signing out locks the app back to the sign-in screen. The
shared board and chat are the exception: they talk to the public
RoadHouse backend on Cloud Run (the `backend/` folder in the
package, deployed once with `roadhouse-deploy-backend.sh` — the
same Cloud Run pattern as the AutoHustle backend). The backend's
public address is baked into the package at `www/rh-config.json`
by the deploy script; the board polls it and chat sends and
receives through it, so every driver sees the same board and chat.
With no connection (or before the backend is deployed) the board
and chat show their last-seen copies and the rest of the app is
unaffected. The only other network call the app ever makes is the
optional Timeline place-address lookup against OpenStreetMap,
which quietly falls back to showing coordinates when there's no
connection.

There is deliberately no `server.url` in `capacitor.config.ts`:
that setting would make the WebView load the whole app from the
server instead of the bundle, changing the app's origin — the
on-device accounts and logs live in the bundled origin's storage,
so every installed driver would open an empty app — and the app
wouldn't open at all offline. The bundle stays on the phone; only
the board and chat calls go out, to the address in
`www/rh-config.json`.

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
  `.github/workflows/build-apk.yml`, this README), plus a `backend/`
  folder (the shared board/chat server) and the two scripts below
  at the top level of the zip.
- **`roadhouse-apk-build.sh`** — a plain-text Termux script. With
  both files in Downloads, running
  `bash ~/storage/shared/Download/roadhouse-apk-build.sh` does the
  whole job: it unzips the package, pushes the `apk/` folder to
  GitHub as its own repo, adds the four signing secrets, runs the
  **Build RoadHouse APK** workflow, and downloads and opens the
  finished APK for install.
- **`roadhouse-deploy-backend.sh`** — a plain-text script, run
  **once** (before the build, so the package being built carries
  the backend's address). Run it where `gcloud` is signed in to
  your Google Cloud project — Termux if gcloud is installed there,
  or Google Cloud Shell in the browser with the zip and the script
  uploaded. It deploys `backend/` to Cloud Run as
  `roadhouse-backend`, reads the service's public address, checks
  it answers, writes the address into the package at
  `apk/www/rh-config.json`, and refreshes the `roadhouse-apk.zip`
  it found. See `backend/README.md` in the package for how the
  backend works.

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
   When signing is set up, the same run also publishes the signed
   release APK as a **GitHub Release** (tagged `v1.0-<run number>`,
   titled "RoadHouse"), so other drivers can download RoadHouse
   straight from the repo's Releases page —
   https://github.com/jeramyadams37-dev/roadhouse-app/releases —
   without opening a workflow run. Share that link; each driver
   downloads `app-release.apk` from the latest release and installs
   it like any other APK.
3. On the phone, open the APK and allow installing from your browser
   or Files app when Android asks. RoadHouse lands on the home screen
   like any other app — the log, taxes, and tools run entirely on
   the phone, online or off, and the board and chat go live against
   the shared backend whenever the phone is online (once the backend
   deploy above has run and its address is in the package).

## Files

- `capacitor.config.ts` — app ID and name. No `server.url`: the
  app is bundled, not loaded from a host (the header comment in the
  file explains why). The shared backend's address lives in
  `www/rh-config.json`, written by the deploy script.
- `package.json` — Capacitor 6 dependencies and scripts.
- `icon/` — the RoadHouse launcher icon (amber roadhouse at the end
  of a highway, on dark charcoal). `icon/res/` mirrors the Android
  `res/` layout — `ic_launcher.png`, `ic_launcher_round.png`, and
  the adaptive `ic_launcher_foreground.png` at every density, the
  `mipmap-anydpi-v26` adaptive-icon definitions, and the charcoal
  background color — and the workflow's "Apply the RoadHouse app
  icon" step copies it over the Capacitor-generated `res/` before
  building, so the installed APK shows this icon on the home screen
  and in the app drawer. `icon-512.png` / `icon-1024.png` are the
  full-size masters.
- `www/` — the built RoadHouse web bundle (`index.html` +
  `assets/`) that gets packaged into the APK, plus `rh-config.json`
  carrying the shared backend's public address (`null` until the
  backend deploy script writes it). Refresh it with a newer bundle
  when the app changes (setup step 2) — and keep the
  `rh-config.json` the deploy script wrote.
- `.github/workflows/build-apk.yml` — the GitHub Actions build:
  Node 20 + Java 17 + Android SDK, generates the Android project with
  Capacitor, builds the debug APK, builds the signed release APK
  when the keystore secrets are present, and — only when that signed
  APK was built — publishes it as a GitHub Release (tag
  `v1.0-<run number>`) other drivers can download.
- The `android/` project is generated by Capacitor during the build
  (`npx cap add android`), so it isn't stored in the repo.
