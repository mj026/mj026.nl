import { Liquid } from "liquidjs";
import type { IndexHtmlTransformResult, Plugin } from "vite";

export default function vitePluginLiquidJS(contentRootDir: string): Plugin {
  return {
    name: "vite-plugin-liquidjs",

    transformIndexHtml: {
      order: "pre",
      async handler(html: string): Promise<IndexHtmlTransformResult> {
        const engine = new Liquid({root: contentRootDir});
        return engine.parseAndRender(html, {});
      },
    },
  };
}
