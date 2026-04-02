import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("LICENSE", () => {
  it("copyright year matches current year", () => {
    const license = readFileSync(join(process.cwd(), "LICENSE"), "utf8");
    const currentYear = new Date().getFullYear().toString();
    expect(license).toContain(`(c) ${currentYear}`);
  });
});
