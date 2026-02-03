import { promises } from "node:fs";
import { join, resolve } from "node:path";
import { assert, test } from "vitest";
import { readFile } from "./utils.js";

test("Test the readFile method for string results", async () => {
  const expected = await promises.readFile(resolve(__dirname, "types.ts"), "utf-8");
  const result = await readFile(resolve(__dirname), "types.ts", "");
  assert(result === expected, "result should be the contents of types.ts");
});

test("Test the readFile method for the default result", async () => {
  const result = await readFile(resolve(__dirname), undefined, "my default contents");
  assert(result === "my default contents", "result should be the default contents");
});

test("Test the readFile method for json results", async () => {
  const expected = await promises.readFile(
    resolve(join(__dirname, "..", ".."), "templates/projects.json"),
    "utf-8",
  );
  const result = await readFile(
    resolve(join(__dirname, "..", "..")),
    "templates/projects.json",
    {},
  );
  assert(
    JSON.stringify(result) === JSON.stringify(JSON.parse(expected)),
    "result should be the contents of projects.json as JSON",
  );
});

test("Test the readFile method for json results", async () => {
  const expected = { my: "json" };
  const result = await readFile(
    resolve(join(__dirname, "..", "..")),
    undefined,
    expected,
  );
  assert(
    JSON.stringify(result) === JSON.stringify(expected),
    "result should be the contents of projects.json as JSON",
  );
});
