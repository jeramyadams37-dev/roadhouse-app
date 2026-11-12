import type { CapacitorConfig } from "@capacitor/cli";

// RoadHouse is a standalone app: the whole web app is bundled into
// the APK from the `www/` folder (webDir below), and everything
// private — the driver's log, expenses, taxes, pre-shift checks,
// sign-in — lives on the phone, in the app's own storage, working
// with no connection.
//
// The shared board and chat are the one live part. They talk to the
// public RoadHouse backend on Cloud Run (the service in the
// package's backend/ folder, deployed once by
// roadhouse-deploy-backend.sh — the same Cloud Run pattern as the
// AutoHustle backend). The backend's public address is baked into
// the package at www/rh-config.json, which the bundled app reads to
// aim its board/chat calls at `<address>/actions`. The deploy
// script writes the real address there after deploying; the copy in
// this package carries no address until then, and with no address
// the board and chat fall back to their last-seen copies, exactly
// as before.
//
// There is deliberately NO `server.url` here, even though that is
// the obvious-looking way to point an APK at a server: server.url
// makes the WebView load the whole app from that address instead of
// the bundle. That would change the app's origin — the on-device
// accounts and logs live in the bundled origin's storage, so every
// installed driver would open an empty app — and the app would not
// open at all with no connection. The bundle stays on the phone;
// only the board and chat calls go out, to the address in
// rh-config.json.
//
// The current RoadHouse web bundle already sits in www/
// (index.html + assets/ + rh-config.json); refresh it there when
// the app changes. See README.md.

const config: CapacitorConfig = {
  appId: "com.atothei.roadhouse",
  appName: "RoadHouse",
  webDir: "www",
  android: {
    // Keep the app's own dark chrome around the web view while loading.
    backgroundColor: "#14161a",
  },
};

export default config;
