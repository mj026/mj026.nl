import type { Plugin, ResolvedConfig } from "vite";

import type { TRenderEngines } from "./types.ts";
import { readFile, templateHTMLMatcher } from "./utils.ts";

export default function vitePluginPartial(renderEngines: TRenderEngines = {}): Plugin {
  let config: ResolvedConfig;
  const engines: TRenderEngines = renderEngines;

  return {
    name: "vite-plugin-partial",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    transformIndexHtml: {
      order: "pre",
      handler(html: string) {
        for (const match of templateHTMLMatcher(html)) {
          const { template, engine, path, json, content } = match;

          if (engine in engines) {
            const renderer = new renderEngines[engine]({
              template: readFile(config.root, path, content),
              context: readFile(config.root, json, {}),
            });
            html = html.replace(template, renderer.render());
          }
        }
        return html;
      },
    },
  };
}
