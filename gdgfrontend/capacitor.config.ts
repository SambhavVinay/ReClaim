import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lostfound.app",
  appName: "reclaim",
  webDir: "out",
  server: {
    cleartext: false,
    allowNavigation: [process.env.NEXT_PUBLIC_BACKEND_URL!],
  },
};

export default config;
