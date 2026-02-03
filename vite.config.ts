import tailwindcss from "@tailwindcss/vite";
import type { UserConfig } from "vite";
import partial from "./src/ts/plugin";

import { ShowdownRenderer, EtaRenderer } from "./src/ts/plugin/renderers";

export default {
  plugins: [
    partial({ eta: EtaRenderer, showdown: ShowdownRenderer }),
    tailwindcss(),
  ],
  root: "src",
  build: {
    target: "es2015",
    outDir: "../dist",
    emptyOutDir: true,
    // No preload stuff is needed as we want the bundle to be very small
    modulePreload: {
      polyfill: false,
    },
  },
} satisfies UserConfig;
