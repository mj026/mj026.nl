import tailwindcss from "@tailwindcss/vite";
import type { UserConfig, PluginOption } from "vite";

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from "glob"
import partial from "./src/ts/plugin/partial";

import { ShowdownRenderer, EtaRenderer, LiquidJSRenderer } from "./src/ts/plugin/partial/renderers";
import liquidjs  from "./src/ts/plugin/liquidjs";

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  plugins: [
    liquidjs(),
    partial({ liquidjs: LiquidJSRenderer }),
    partial({ eta: EtaRenderer, showdown: ShowdownRenderer, liquidjs: LiquidJSRenderer }),
    tailwindcss(),
  ],
  root: "src",
  publicDir: "../public",
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
