import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ConfigSchema } from "@/config.ts";

const schemaJson = JSON.parse(readFileSync(join(process.cwd(), "schema.json"), "utf8"));
const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");

const zodKeys = Object.keys(ConfigSchema.shape);
const schemaKeys = Object.keys(schemaJson.properties);

describe("config sources are in sync", () => {
  it("schema.json properties match Zod schema fields", () => {
    expect(schemaKeys.sort()).toEqual(zodKeys.sort());
  });

  for (const key of zodKeys) {
    it(`README documents "${key}"`, () => {
      expect(readme).toContain(`\`${key}\``);
    });
  }
});
