import fs from "node:fs";
import { resolve } from "node:path";

export function readJSON(root: string, jsonPath: string | undefined): object {
  // Return the JSON data as object or default to {}
  if (jsonPath !== undefined) {
    return JSON.parse(fs.readFileSync(resolve(root, jsonPath)).toString());
  }
  return {};
}

export function readFile(
  root: string,
  templatePath: string | undefined,
  content: string = "",
): string {
  // Return the template contents as string to 'content'
  if (templatePath !== undefined) {
    return fs.readFileSync(resolve(root, templatePath), "utf8");
  }
  return content;
}

// Match templates like
// <template
//   data-template-engine="showdown"
//   data-template-path="templates/about.md"></template>
const regex =
  /(?<template><template(?:\n|\s)+data-template-engine="(?<engine>[^"]+)"(?:(?:\n|\s)+data-template-path="(?<path>[^"]+)")*(?:(?:\n|\s)+data-template-json="(?<json>[^"]+)")*>(?<content>[^<]*)<\/template>)/gs;

type TemplateMatchObject = {
  template: string;
  engine: string;
  path: string | undefined;
  json: string | undefined;
  content: string;
};

export function* templateHTMLMatcher(html: string): Generator<TemplateMatchObject> {
  for (const match of html.matchAll(regex)) {
    yield match.groups as TemplateMatchObject;
  }
}
