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
