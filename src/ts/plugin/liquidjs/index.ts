import { Liquid } from "liquidjs";
import type { IndexHtmlTransformResult, Plugin } from "vite";

export default function vitePluginLiquidJS(): Plugin {
  return {
    name: "vite-plugin-liquidjs",

    transformIndexHtml: {
      order: "pre",
      async handler(html: string): Promise<IndexHtmlTransformResult> {
        const engine = new Liquid();
        return engine.parseAndRender(html, {});
      },
    },
  };
}
