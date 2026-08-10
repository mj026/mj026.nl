import { Liquid } from "liquidjs";
import { AbstractPartialRenderer } from "../types.ts";

export class LiquidJSRenderer extends AbstractPartialRenderer {
  async render(contentRootDir: string) {
    const engine = new Liquid({root: contentRootDir});
    return engine.parseAndRender(this.config.template, this.config.context);
  }
}
