import type { UserConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import nunjucks from "@vituum/vite-plugin-nunjucks";

export default {
  plugins: [nunjucks(), tailwindcss()],
  root: "src",
  build: {
    target: "es2015",
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: ["src/index.njk.html"],
    },
    modulePreload: {
      polyfill: false,
    },
  },
  // Added this so vite-plugin-nunjucks won't complain about the missing index.njk.html file,
  // as the .html extension is needed for rollup, but will be omitted when actually building the
  // html
  optimizeDeps: {
    entries: [],
  },
} satisfies UserConfig;
