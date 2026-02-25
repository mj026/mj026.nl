import { Liquid } from "liquidjs";
import { AbstractPartialRenderer } from "../types.ts";

export class LiquidJSRenderer extends AbstractPartialRenderer {
  async render() {
    const engine = new Liquid();
    return engine.parseAndRender(this.config.template, this.config.context);
  }
}
