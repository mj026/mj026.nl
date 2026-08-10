import type { IndexHtmlTransformResult, Plugin } from "vite";

import type { TRenderEngines } from "./types.ts";
import { readFile, templateHTMLMatcher } from "./utils.ts";

export default function vitePluginPartial(renderEngines: TRenderEngines = {}, contentRootDir: string): Plugin {
  const engines: TRenderEngines = renderEngines;

  return {
    name: "vite-plugin-partial",
    transformIndexHtml: {
      order: "pre",
      async handler(html: string): Promise<IndexHtmlTransformResult> {
        for (const match of templateHTMLMatcher(html)) {
          const { template, engine, path, json, content } = match;
          if (engine in engines) {
            const renderer = new renderEngines[engine]({
              template: await readFile(contentRootDir, path, content),
              context: await readFile(contentRootDir, json, {}),
            });
            const replacableHtml = await renderer.render(contentRootDir);
            html = html.replace(template, replacableHtml);
          }
        }
        return html;
      },
    },
  };
}
