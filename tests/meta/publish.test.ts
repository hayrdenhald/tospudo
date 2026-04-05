import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

describe("package.json publish fields point to dist/", () => {
  it("bin entry points into dist/", () => {
    for (const [, path] of Object.entries(pkg.bin as Record<string, string>)) {
      expect(path).toMatch(/^\.\/dist\//);
    }
  });

  it("files includes dist", () => {
    expect(pkg.files).toContain("dist");
  });
});
