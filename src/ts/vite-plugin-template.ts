import fs from "node:fs";
import { resolve } from "node:path";
import { Eta } from "eta";
import type { Plugin, ResolvedConfig } from "vite";
import renderShowdown from "./showdown.ts";

// Match templates like
// <template
//   data-template-engine="showdown"
//   data-template-path="templates/about.md"></template>
const regex =
  /<template(.|\r\n|\r|\n)+?data-template-engine="(?<engine>.*?)"(.|\r\n|\r|\n)+?data-template-path="(?<template>.*?)"(.|\n)*?<\/template>/gi;

function readJSON(root: string, jsonPath: string | undefined): object {
  if (jsonPath !== undefined) {
    return JSON.parse(fs.readFileSync(resolve(root, jsonPath)).toString());
  }
  return {};
}

type TemplateConfig = {
  root: string;
  templatePath: string;
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
    const eta = new Eta({ views: this.config.root, varName: "data" });
    return eta.render(this.config.templatePath, this.config.context);
  }
}

class ShowdownRenderer extends TemplateRenderer {
  render() {
    const template = fs.readFileSync(
      resolve(this.config.root, this.config.templatePath),
    );
    return renderShowdown(template.toString());
  }
}

// We need a abstract construct signature here as abstract classes can't be initiated
type TemplateRendererConstructor = new (config: TemplateConfig) => TemplateRenderer;

const templateEngines: Record<string, TemplateRendererConstructor> = {
  eta: EtaRenderer,
  showdown: ShowdownRenderer,
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
          // This matches the complete <template> ...</template> part which we want to replace
          const templateTag = match[0];

          // Check if a data.json is supplied and add this as context
          const regexJson = /(.|\r\n|\r|\n)+data-template-json="(?<json>.*)"/gi;
          const jsonPath = regexJson.exec(templateTag)?.groups?.json;

          const templatePath: string | undefined = match.groups?.template;
          const engine: string | undefined = match.groups?.engine;

          if (templatePath && engine && engine in templateEngines) {
            const renderer = new templateEngines[engine]({
              root: config.root,
              templatePath: templatePath,
              context: readJSON(config.root, jsonPath),
            });
            html = html.replace(templateTag, renderer.render());
          }
        }
        return html;
      },
    },
  };
}
