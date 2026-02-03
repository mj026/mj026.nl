import { Eta } from "eta";
import { AbstractPartialRenderer } from "../types.ts";

export class EtaRenderer extends AbstractPartialRenderer {
  render() {
    const eta = new Eta({ varName: "data" });
    return eta.renderString(this.config.template, this.config.context);
  }
}
