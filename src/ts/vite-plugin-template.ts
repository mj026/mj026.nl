import { Eta } from "eta";
import type { Plugin, ResolvedConfig } from "vite";
import renderShowdown from "./showdown.ts";
import { readFile, readJSON } from "./utils.ts";

// Match templates like
// <template
//   data-template-engine="showdown"
//   data-template-path="templates/about.md"></template>
const regex =
  /(?<template><template(?:\n|\s)+data-template-engine="(?<engine>[^"]+)"(?:(?:\n|\s)+data-template-path="(?<path>[^"]+)")*(?:(?:\n|\s)+data-template-json="(?<json>[^"]+)")*>(?<content>[^<]*)<\/template>)/gs;

type TemplateConfig = {
  template: string;
  context: object;
};

interface ITemplateRenderer {
  config: TemplateConfig;

  render(): string;
}

abstract class TemplateRenderer implements ITemplateRenderer {
  config: TemplateConfig;

  constructor(config: TemplateConfig) {
    this.config = config;
  }

  abstract render(): string;
}

class EtaRenderer extends TemplateRenderer {
  render() {
    const eta = new Eta({ varName: "data" });
    return eta.renderString(this.config.template, this.config.context);
  }
}

class ShowdownRenderer extends TemplateRenderer {
  render() {
    return renderShowdown(this.config.template.toString());
  }
}

// We need a abstract construct signature here as abstract classes can't be initiated
// See https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-construct-signatures
type TemplateRendererConstructor = new (config: TemplateConfig) => TemplateRenderer;

const templateEngines: Record<string, TemplateRendererConstructor> = {
  eta: EtaRenderer,
  showdown: ShowdownRenderer,
};

type TemplateMatchObject = {
  template: string;
  engine: string;
  path: string | undefined;
  json: string | undefined;
  content: string;
};

export default function vitePluginTemplate(): Plugin {
  let config: ResolvedConfig;

  return {
    name: "vite-plugin-template",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    transformIndexHtml: {
      order: "pre",
      handler(html: string) {
        for (const match of html.matchAll(regex)) {
          const { template, engine, path, json, content } =
            match.groups as TemplateMatchObject;

          if (engine in templateEngines) {
            const renderer = new templateEngines[engine]({
              template: readFile(config.root, path, content),
              context: readJSON(config.root, json),
            });
            html = html.replace(template, renderer.render());
          }
        }
        return html;
      },
    },
  };
}
