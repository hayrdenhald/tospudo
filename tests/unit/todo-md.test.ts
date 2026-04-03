import { describe, expect, it } from "vitest";
import {
  appendTodo,
  completeLine,
  deleteLine,
  hasSections,
  migrateToSections,
  parseAllItems,
  parseAllItemsWithStatus,
  parseCompletedLines,
  parseLines,
  pruneEmptySections,
  uncompleteLine,
} from "@/todo-md.ts";

const SAMPLE = `# Tasks

- [ ] Fix login flow
- [x] Already done
- [ ] Refactor authentication
Regular line
`;

describe("parseLines", () => {
  it("returns only unchecked items with their line indices", () => {
    const result = parseLines(SAMPLE);
    expect(result).toEqual([
      { index: 2, text: "Fix login flow" },
      { index: 4, text: "Refactor authentication" },
    ]);
  });

  it("returns empty array when no unchecked items", () => {
    expect(parseLines("- [x] done\n- [x] also done\n")).toEqual([]);
  });

  it("returns empty array for empty content", () => {
    expect(parseLines("")).toEqual([]);
  });
});

describe("completeLine", () => {
  it("marks the target line as checked", () => {
    const result = completeLine(SAMPLE, 2);
    const lines = result.split("\n");
    expect(lines[2]).toBe("- [x] Fix login flow");
  });

  it("leaves all other lines untouched", () => {
    const result = completeLine(SAMPLE, 2);
    const original = SAMPLE.split("\n");
    const updated = result.split("\n");
    for (let i = 0; i < original.length; i++) {
      if (i !== 2) expect(updated[i]).toBe(original[i]);
    }
  });

  it("throws RangeError for out-of-bounds index", () => {
    expect(() => completeLine(SAMPLE, 999)).toThrow(RangeError);
  });

  it("throws RangeError for negative index", () => {
    expect(() => completeLine(SAMPLE, -1)).toThrow(RangeError);
  });
});

describe("deleteLine", () => {
  it("removes the target line", () => {
    const result = deleteLine(SAMPLE, 2);
    expect(result).not.toContain("Fix login flow");
  });

  it("leaves all other lines untouched", () => {
    const result = deleteLine(SAMPLE, 2);
    const original = SAMPLE.split("\n");
    const updated = result.split("\n");
    // Original had line at index 2 removed, so updated has one fewer line
    expect(updated.length).toBe(original.length - 1);
    expect(updated[2]).toBe(original[3]);
  });

  it("throws RangeError for out-of-bounds index", () => {
    expect(() => deleteLine(SAMPLE, 999)).toThrow(RangeError);
  });

  it("throws RangeError for negative index", () => {
    expect(() => deleteLine(SAMPLE, -1)).toThrow(RangeError);
  });
});

describe("parseCompletedLines", () => {
  it("returns only checked items with their line indices", () => {
    expect(parseCompletedLines(SAMPLE)).toEqual([{ index: 3, text: "Already done" }]);
  });

  it("returns empty array when no completed items", () => {
    expect(parseCompletedLines("- [ ] pending\n")).toEqual([]);
  });
});

describe("parseAllItems", () => {
  it("returns all checkbox items regardless of state", () => {
    expect(parseAllItems(SAMPLE)).toEqual([
      { index: 2, text: "Fix login flow" },
      { index: 3, text: "Already done" },
      { index: 4, text: "Refactor authentication" },
    ]);
  });

  it("excludes non-checkbox lines", () => {
    const result = parseAllItems(SAMPLE);
    expect(result.some((i) => i.text === "Regular line")).toBe(false);
  });
});

describe("uncompleteLine", () => {
  it("marks the target line as unchecked", () => {
    const result = uncompleteLine(SAMPLE, 3);
    expect(result.split("\n")[3]).toBe("- [ ] Already done");
  });

  it("leaves all other lines untouched", () => {
    const result = uncompleteLine(SAMPLE, 3);
    const original = SAMPLE.split("\n");
    const updated = result.split("\n");
    for (let i = 0; i < original.length; i++) {
      if (i !== 3) expect(updated[i]).toBe(original[i]);
    }
  });

  it("throws RangeError for out-of-bounds index", () => {
    expect(() => uncompleteLine(SAMPLE, 999)).toThrow(RangeError);
  });

  it("throws RangeError for negative index", () => {
    expect(() => uncompleteLine(SAMPLE, -1)).toThrow(RangeError);
  });
});

describe("parseAllItemsWithStatus", () => {
  it("returns all items with checked status", () => {
    expect(parseAllItemsWithStatus(SAMPLE)).toEqual([
      { index: 2, text: "Fix login flow", checked: false },
      { index: 3, text: "Already done", checked: true },
      { index: 4, text: "Refactor authentication", checked: false },
    ]);
  });
});

describe("appendTodo", () => {
  it("appends a new unchecked item", () => {
    const result = appendTodo(SAMPLE, "Write tests");
    expect(result).toContain("- [ ] Write tests");
  });

  it("appended item is the last line", () => {
    const result = appendTodo(SAMPLE, "Write tests");
    const lines = result.trimEnd().split("\n");
    expect(lines[lines.length - 1]).toBe("- [ ] Write tests");
  });

  it("handles empty content", () => {
    expect(appendTodo("", "First task")).toBe("- [ ] First task\n");
  });

  it("handles content without trailing newline", () => {
    const result = appendTodo("- [ ] existing", "new task");
    expect(result).toBe("- [ ] existing\n- [ ] new task\n");
  });
});

const SECTIONED = `## fix\n\n- [ ] Fix login flow\n\n## chore\n\n- [x] Already done\n- [ ] Refactor auth\n`;

describe("appendTodo with section", () => {
  it("appends under an existing section after the last item", () => {
    const result = appendTodo(SECTIONED, "New fix", "fix");
    const lines = result.split("\n");
    const fixIdx = lines.indexOf("- [ ] Fix login flow");
    expect(lines[fixIdx + 1]).toBe("- [ ] New fix");
  });

  it("appends to the last item in a section", () => {
    const result = appendTodo(SECTIONED, "Cleanup", "chore");
    const lines = result.split("\n");
    const refactorIdx = lines.indexOf("- [ ] Refactor auth");
    expect(lines[refactorIdx + 1]).toBe("- [ ] Cleanup");
  });

  it("creates a new section when it does not exist", () => {
    const result = appendTodo(SECTIONED, "Add unit tests", "test");
    expect(result).toContain("## 🧪 test\n\n- [ ] Add unit tests");
  });

  it("creates a new section without emoji when emoji=false", () => {
    const result = appendTodo(SECTIONED, "Add unit tests", "test", false);
    expect(result).toContain("## test\n\n- [ ] Add unit tests");
  });

  it("inserts into an empty section block", () => {
    const content = "## fix\n\n## chore\n\n- [ ] existing\n";
    const result = appendTodo(content, "First fix", "fix");
    const lines = result.split("\n");
    const fixIdx = lines.indexOf("## fix");
    expect(lines[fixIdx + 2]).toBe("- [ ] First fix");
  });

  it("backward compat: no section arg still appends at end", () => {
    const result = appendTodo(SECTIONED, "bare item");
    const lines = result.trimEnd().split("\n");
    expect(lines[lines.length - 1]).toBe("- [ ] bare item");
  });
});

describe("hasSections", () => {
  it("returns false for flat format", () => {
    expect(hasSections(SAMPLE)).toBe(false);
  });

  it("returns true for sectioned format", () => {
    expect(hasSections(SECTIONED)).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(hasSections("")).toBe(false);
  });

  it("returns false when only # headings exist (not ##)", () => {
    expect(hasSections("# Tasks\n\n- [ ] item\n")).toBe(false);
  });
});

describe("migrateToSections", () => {
  it("migrates flat content to ## fix section with emoji by default", () => {
    const result = migrateToSections(SAMPLE);
    expect(result).toContain("## 🐛 fix");
    expect(result).toContain("- [ ] Fix login flow");
    expect(result).toContain("- [ ] Refactor authentication");
  });

  it("migrates flat content to ## fix section without emoji when emoji=false", () => {
    const result = migrateToSections(SAMPLE, false);
    expect(result).toContain("## fix");
    expect(result).not.toContain("🐛");
  });

  it("drops the old # Tasks title", () => {
    const result = migrateToSections(SAMPLE);
    expect(result).not.toContain("# Tasks");
  });

  it("preserves checked state of items", () => {
    const result = migrateToSections(SAMPLE);
    expect(result).toContain("- [x] Already done");
  });

  it("returns content as-is when there are no checkbox items", () => {
    const prose = "# Tasks\n\nSome notes here\n";
    expect(migrateToSections(prose)).toBe(prose);
  });

  it("returns empty string as-is", () => {
    expect(migrateToSections("")).toBe("");
  });
});

describe("pruneEmptySections", () => {
  it("removes a section header when all its items are removed", () => {
    const content = "## fix\n\n## chore\n\n- [ ] remaining\n";
    const result = pruneEmptySections(content);
    expect(result).not.toContain("## fix");
    expect(result).toContain("## chore");
    expect(result).toContain("- [ ] remaining");
  });

  it("keeps a section that still has items", () => {
    const result = pruneEmptySections(SECTIONED);
    expect(result).toContain("## fix");
    expect(result).toContain("## chore");
  });

  it("removes all sections when all items are gone", () => {
    const content = "## fix\n\n## chore\n\n";
    const result = pruneEmptySections(content);
    expect(result).not.toContain("## fix");
    expect(result).not.toContain("## chore");
  });

  it("is a no-op on flat content without section headers", () => {
    const result = pruneEmptySections(SAMPLE);
    expect(result).toBe(SAMPLE);
  });
});
