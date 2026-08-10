import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "vitest/config";

import { glob } from "glob";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import partial from "./src/plugin/partial";

import liquidjs from "./src/plugin/liquidjs";
import { EtaRenderer, LiquidJSRenderer, ShowdownRenderer } from "./src/plugin/partial/renderers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRootDir = resolve(__dirname, "src/content");

export default defineConfig({
  plugins: [
    liquidjs(contentRootDir),
    partial({ liquidjs: LiquidJSRenderer }, contentRootDir),
    partial({ eta: EtaRenderer, showdown: ShowdownRenderer, liquidjs: LiquidJSRenderer }, contentRootDir),
    tailwindcss()
  ],
  root: "src/site",
  publicDir: "../../public",
  build: {
    target: "es2015",
    outDir: "../dist",
    emptyOutDir: true,
    // No preload stuff is needed as we want the bundle to be very small
    modulePreload: {
      polyfill: false
    },
    rollupOptions: {
      input: glob.sync(resolve(__dirname, "src", "**/*.html"))
    }
  },
  test: {
    include: ["../plugin/**/*.{test,spec}.{js,ts,jsx,tsx}"]
  }
});
