import type { IndexHtmlTransformResult, Plugin, ResolvedConfig } from "vite";

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
      async handler(html: string): Promise<IndexHtmlTransformResult> {
        for (const match of templateHTMLMatcher(html)) {
          const { template, engine, path, json, content } = match;
          if (engine in engines) {
            const renderer = new renderEngines[engine]({
              template: await readFile(config.root, path, content),
              context: await readFile(config.root, json, {}),
            });
            const replacableHtml = await renderer.render();
            html = html.replace(template, replacableHtml);
          }
        }

        return html;
      },
    },
  };
}
