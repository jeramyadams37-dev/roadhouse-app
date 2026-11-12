import type { CapacitorConfig } from "@capacitor/cli";

// RoadHouse is a standalone offline app: the whole web app is bundled
// into the APK from the `www/` folder (webDir below) and everything
// the driver logs is saved on the phone, in the app's own storage.
// There is deliberately NO `server.url` here — the APK loads nothing
// from a hosted backend, needs no live address, and works with no
// connection. (The only network call the app ever makes is the
// optional Timeline place-address lookup against OpenStreetMap,
// which falls back to coordinates when offline.)
//
// The current RoadHouse web bundle already sits in www/
// (index.html + assets/); refresh it there when the app changes.
// See README.md.

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
