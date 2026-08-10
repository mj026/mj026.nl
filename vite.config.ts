import tailwindcss from "@tailwindcss/vite";
import type { UserConfig } from "vite";

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from "glob"
import partial from "./src/plugin/partial";

import { ShowdownRenderer, EtaRenderer, LiquidJSRenderer } from "./src/plugin/partial/renderers";
import liquidjs  from "./src/plugin/liquidjs";

const __dirname = dirname(fileURLToPath(import.meta.url))
const contentRootDir = resolve(__dirname, "src/content")

export default {
  plugins: [
    liquidjs(contentRootDir),
    partial({ liquidjs: LiquidJSRenderer }, contentRootDir),
    partial({ eta: EtaRenderer, showdown: ShowdownRenderer, liquidjs: LiquidJSRenderer }, contentRootDir),
    tailwindcss(),
  ],
  root: "src/site",
  publicDir: "../../public",
  build: {
    target: "es2015",
    outDir: "../dist",
    emptyOutDir: true,
    // No preload stuff is needed as we want the bundle to be very small
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      input: glob.sync(resolve(__dirname, "src", "**/*.html"))
    }
  },
} satisfies UserConfig;
