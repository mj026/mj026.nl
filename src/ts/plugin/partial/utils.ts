import { promises } from "node:fs";
import { resolve } from "node:path";

export async function readFile<T extends string | object>(
  root: string,
  path: string | undefined,
  defaultValue: T,
): Promise<T> {
  if (path === undefined) {
    return defaultValue;
  }

  switch (typeof defaultValue) {
    case "string": {
      return promises.readFile(resolve(root, path), "utf8") as T;
    }
    case "object": {
      const response = await promises.readFile(resolve(root, path), "utf8");
      return JSON.parse(response);
    }
  }
}

// Match templates like
// <template
//   data-template-engine="showdown"
//   data-template-path="partials/about.md"></template>
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
