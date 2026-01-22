import tailwindcss from "@tailwindcss/vite";
import type { UserConfig } from "vite";
import template from "./src/ts/vite-plugin-template";

export default {
  plugins: [template(), tailwindcss()],
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
