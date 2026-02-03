import { Eta } from "eta";
import { AbstractPartialRenderer } from "../types.ts";

export class EtaRenderer extends AbstractPartialRenderer {
  async render() {
    const eta = new Eta({ varName: "data" });
    return new Promise<string>((resolve) =>
      resolve(eta.renderString(this.config.template, this.config.context)),
    );
  }
}
