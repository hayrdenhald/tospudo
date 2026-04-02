import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseFileForTodos, parseTodoMd } from "@/parser.ts";
import { type SampleFilename, samples } from "../helpers/samples.ts";

const samplesDir = join(import.meta.dirname, "samples");

function readSample(name: SampleFilename): string {
  return readFileSync(join(samplesDir, name), "utf8");
}

describe("sample.ts", () => {
  const content = readSample(samples.ts);

  it("finds 2 TODOs/FIXMEs", () => {
    expect(parseFileForTodos(content, samples.ts)).toHaveLength(2);
  });

  it("first match is TODO on line 1", () => {
    const result = parseFileForTodos(content, samples.ts);
    expect(result[0].line).toBe(1);
    expect(result[0].text).toContain("TODO");
  });

  it("second match is FIXME on line 3", () => {
    const result = parseFileForTodos(content, samples.ts);
    expect(result[1].line).toBe(3);
    expect(result[1].text).toContain("FIXME");
  });
});

describe("sample.tsx", () => {
  const content = readSample(samples.tsx);

  it("finds 2 TODOs/FIXMEs", () => {
    expect(parseFileForTodos(content, samples.tsx)).toHaveLength(2);
  });

  it("first match is TODO on line 1", () => {
    const result = parseFileForTodos(content, samples.tsx);
    expect(result[0].line).toBe(1);
    expect(result[0].text).toContain("TODO");
  });

  it("second match is FIXME on line 3", () => {
    const result = parseFileForTodos(content, samples.tsx);
    expect(result[1].line).toBe(3);
    expect(result[1].text).toContain("FIXME");
  });
});

describe("sample.js", () => {
  const content = readSample(samples.js);

  it("finds 1 TODO", () => {
    expect(parseFileForTodos(content, samples.js)).toHaveLength(1);
  });

  it("match is TODO on line 1", () => {
    const result = parseFileForTodos(content, samples.js);
    expect(result[0].line).toBe(1);
    expect(result[0].text).toContain("TODO");
  });
});

describe("sample.jsx", () => {
  const content = readSample(samples.jsx);

  it("finds 1 FIXME", () => {
    expect(parseFileForTodos(content, samples.jsx)).toHaveLength(1);
  });

  it("match is FIXME on line 1", () => {
    const result = parseFileForTodos(content, samples.jsx);
    expect(result[0].line).toBe(1);
    expect(result[0].text).toContain("FIXME");
  });
});

describe("sample.astro", () => {
  const content = readSample(samples.astro);

  it("finds 2 TODOs/FIXMEs", () => {
    expect(parseFileForTodos(content, samples.astro)).toHaveLength(2);
  });

  it("first match is TODO in frontmatter on line 2", () => {
    const result = parseFileForTodos(content, samples.astro);
    expect(result[0].line).toBe(2);
    expect(result[0].text).toContain("TODO");
  });

  it("second match is FIXME in template on line 6", () => {
    const result = parseFileForTodos(content, samples.astro);
    expect(result[1].line).toBe(7);
    expect(result[1].text).toContain("FIXME");
  });
});

describe("sample.css", () => {
  const content = readSample(samples.css);

  it("finds 2 TODOs/FIXMEs", () => {
    expect(parseFileForTodos(content, samples.css)).toHaveLength(2);
  });

  it("first match is TODO on line 1", () => {
    const result = parseFileForTodos(content, samples.css);
    expect(result[0].line).toBe(1);
    expect(result[0].text).toContain("TODO");
  });

  it("second match is FIXME on line 3", () => {
    const result = parseFileForTodos(content, samples.css);
    expect(result[1].line).toBe(3);
    expect(result[1].text).toContain("FIXME");
  });
});

describe("sample.html", () => {
  const content = readSample(samples.html);

  it("finds 2 TODOs/FIXMEs", () => {
    expect(parseFileForTodos(content, samples.html)).toHaveLength(2);
  });

  it("first match is TODO on line 1", () => {
    const result = parseFileForTodos(content, samples.html);
    expect(result[0].line).toBe(1);
    expect(result[0].text).toContain("TODO");
  });

  it("second match is FIXME on line 3", () => {
    const result = parseFileForTodos(content, samples.html);
    expect(result[1].line).toBe(3);
    expect(result[1].text).toContain("FIXME");
  });
});

describe("multiline.ts — block comments", () => {
  const content = readSample(samples.multiline);

  it("finds 2 TODOs/FIXMEs inside block comments", () => {
    expect(parseFileForTodos(content, samples.multiline)).toHaveLength(2);
  });

  it("TODO is on line 2 (inside opening block comment)", () => {
    const result = parseFileForTodos(content, samples.multiline);
    expect(result[0].line).toBe(2);
    expect(result[0].text).toContain("TODO");
  });

  it("FIXME is on line 8 (inside inner block comment)", () => {
    const result = parseFileForTodos(content, samples.multiline);
    expect(result[1].line).toBe(8);
    expect(result[1].text).toContain("FIXME");
  });
});

describe("mixedcase.ts — case variations", () => {
  const content = readSample(samples.mixedcase);

  it("finds all 6 mixed-case variants", () => {
    expect(parseFileForTodos(content, samples.mixedcase)).toHaveLength(6);
  });

  it.each([
    [1, "ToDo"],
    [2, "tODO"],
    [3, "Fixme"],
    [4, "fixME"],
    [5, "FIXME"],
    [6, "TODO"],
  ])("line %i detects %s", (line, keyword) => {
    const result = parseFileForTodos(content, samples.mixedcase);
    const match = result.find((r) => r.line === line);
    expect(match).toBeDefined();
    expect(match?.text.toLowerCase()).toContain(keyword.toLowerCase());
  });
});

describe("clean.ts", () => {
  it("finds no TODOs", () => {
    const content = readSample(samples.clean);
    expect(parseFileForTodos(content, samples.clean)).toHaveLength(0);
  });
});

describe("TODO.md", () => {
  const content = readSample(samples.todo);

  it("finds 2 unchecked items", () => {
    expect(parseTodoMd(content, samples.todo)).toHaveLength(2);
  });

  it("first item is 'Fix the login flow'", () => {
    expect(parseTodoMd(content, samples.todo)[0].text).toBe("Fix the login flow");
  });

  it("second item is 'Refactor authentication'", () => {
    expect(parseTodoMd(content, samples.todo)[1].text).toBe("Refactor authentication");
  });

  it("checked item is excluded", () => {
    const result = parseTodoMd(content, samples.todo);
    expect(result.every((r) => r.text !== "Already done")).toBe(true);
  });

  it("regular line is excluded", () => {
    const result = parseTodoMd(content, samples.todo);
    expect(result.every((r) => !r.text.includes("Regular line"))).toBe(true);
  });

  it("items have no line numbers", () => {
    const result = parseTodoMd(content, samples.todo);
    expect(result.every((r) => r.line === undefined)).toBe(true);
  });
});
