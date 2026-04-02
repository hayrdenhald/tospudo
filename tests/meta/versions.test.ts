import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
const allDeps: Record<string, string> = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
};

describe("dependency versions are pinned", () => {
  for (const [name, version] of Object.entries(allDeps)) {
    it(`${name} has no range prefix`, () => {
      expect(version).toMatch(/^\d/);
    });
  }
});
