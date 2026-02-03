import showdown from "showdown";

import { AbstractPartialRenderer } from "../types.ts";

const converter = new showdown.Converter({
  extensions: [],
});
converter.setOption("parseImgDimensions", true);
converter.setOption("emoji", true);
converter.setOption("tables", true);
converter.setFlavor("github");
converter.setOption("openLinksInNewWindow", true);

export class ShowdownRenderer extends AbstractPartialRenderer {
  async render() {
    return new Promise<string>((resolve) =>
      resolve(converter.makeHtml(this.config.template.trim())),
    );
  }
}
