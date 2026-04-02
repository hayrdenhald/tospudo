import { describe, expect, test } from "vitest";
import { parseFileForTodos, parseTodoMd } from "@/parser.ts";
import { samples } from "../helpers/samples.ts";

const NON_EXISTENT_TEST_FILE = "non-existent-test-file.example";

describe("parseFileForTodos", () => {
  test("detects TODO comment", () => {
    const result = parseFileForTodos("// TODO: fix this", NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(1);
    expect(result[0].text).toContain("TODO");
  });

  test("detects FIXME comment", () => {
    const result = parseFileForTodos("// FIXME: broken", NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(1);
    expect(result[0].text).toContain("FIXME");
  });

  test("is case-insensitive for todo", () => {
    const result = parseFileForTodos("// todo: lowercase", NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(1);
  });

  test("is case-insensitive for fixme", () => {
    const result = parseFileForTodos("// fixme: lowercase", NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(1);
  });

  test.each(["ToDo", "tODO", "TODO", "todo"])("detects %s as a TODO", (keyword) => {
    const result = parseFileForTodos(`// ${keyword}: something`, NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(1);
  });

  test.each(["Fixme", "fixME", "FIXME", "fixme"])("detects %s as a FIXME", (keyword) => {
    const result = parseFileForTodos(`// ${keyword}: something`, NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(1);
  });

  test("returns correct 1-indexed line numbers", () => {
    const content = "line one\n// TODO: line two\nline three";
    const result = parseFileForTodos(content, NON_EXISTENT_TEST_FILE);
    expect(result[0].line).toBe(2);
  });

  test("finds multiple TODOs in one file", () => {
    const content = "// TODO: one\n// FIXME: two\nnormal line";
    const result = parseFileForTodos(content, NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(2);
  });

  test("ignores lines without TODO/FIXME", () => {
    const result = parseFileForTodos("const x = 1\nconst y = 2", NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(0);
  });

  test("text starts from the keyword", () => {
    const result = parseFileForTodos("    // TODO: handle edge case", NON_EXISTENT_TEST_FILE);
    expect(result[0].text).toBe("TODO: handle edge case");
  });

  test("strips trailing */ from inline block comment", () => {
    const result = parseFileForTodos("/* TODO: fix this */", NON_EXISTENT_TEST_FILE);
    expect(result[0].text).toBe("TODO: fix this");
  });

  test("strips trailing --> from inline HTML comment", () => {
    const result = parseFileForTodos("<!-- TODO: add markup -->", NON_EXISTENT_TEST_FILE);
    expect(result[0].text).toBe("TODO: add markup");
  });

  test("works without a colon after keyword", () => {
    const result = parseFileForTodos("// TODO fix this later", NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(1);
    expect(result[0].text).toContain("TODO");
  });

  test("hasMore is true when next line is a comment", () => {
    const content = "// TODO: fix this\n// more context here";
    const result = parseFileForTodos(content, NON_EXISTENT_TEST_FILE);
    expect(result[0].hasMore).toBe(true);
  });

  test("hasMore is false when next line is not a comment", () => {
    const content = "// TODO: fix this\nconst x = 1;";
    const result = parseFileForTodos(content, NON_EXISTENT_TEST_FILE);
    expect(result[0].hasMore).toBe(false);
  });

  test("hasMore is false when TODO is the last line", () => {
    const result = parseFileForTodos("// TODO: fix this", NON_EXISTENT_TEST_FILE);
    expect(result[0].hasMore).toBe(false);
  });
});

describe("false positives — TODO/FIXME not in a comment", () => {
  test("does not match TODO in a template literal", () => {
    const result = parseFileForTodos(
      // biome-ignore lint/suspicious/noTemplateCurlyInString: just for testing
      "expect(x).toContain(`Todo with ID ${id} not found`);",
      NON_EXISTENT_TEST_FILE,
    );
    expect(result).toHaveLength(0);
  });

  test("does not match FIXME in a double-quoted string", () => {
    const result = parseFileForTodos(
      'const msg = "fixme: not a real comment";',
      NON_EXISTENT_TEST_FILE,
    );
    expect(result).toHaveLength(0);
  });

  test("does not match TODO in an identifier name", () => {
    const result = parseFileForTodos("todoList.push(item);", NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(0);
  });

  test("still matches TODO after // on a line with preceding code", () => {
    const result = parseFileForTodos(
      "return null; // TODO: handle this case",
      NON_EXISTENT_TEST_FILE,
    );
    expect(result).toHaveLength(1);
  });

  test("does not match 'todo' used as a noun in a JSDoc comment", () => {
    const content =
      "/**\n * Get a specific todo by ID\n * @description Updates an existing todo item\n */";
    const result = parseFileForTodos(content, NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(0);
  });

  test("does not match 'todo' mid-sentence in a block comment", () => {
    const result = parseFileForTodos("/* Update a todo item */", NON_EXISTENT_TEST_FILE);
    expect(result).toHaveLength(0);
  });
});

describe("parseTodoMd", () => {
  test("finds unchecked checkboxes", () => {
    const result = parseTodoMd("- [ ] Fix the login flow", samples.todo);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Fix the login flow");
  });

  test("ignores checked checkboxes [x]", () => {
    const result = parseTodoMd("- [x] Already done", samples.todo);
    expect(result).toHaveLength(0);
  });

  test("ignores checked checkboxes [X]", () => {
    const result = parseTodoMd("- [X] Also done", samples.todo);
    expect(result).toHaveLength(0);
  });

  test("does not require TODO keyword in text", () => {
    const result = parseTodoMd("- [ ] Refactor authentication", samples.todo);
    expect(result[0].text).toBe("Refactor authentication");
  });

  test("omits line number", () => {
    const result = parseTodoMd("- [ ] something", samples.todo);
    expect(result[0].line).toBeUndefined();
  });

  test("finds multiple unchecked items", () => {
    const content = "- [ ] Item one\n- [x] Done item\n- [ ] Item two";
    const result = parseTodoMd(content, samples.todo);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Item one");
    expect(result[1].text).toBe("Item two");
  });

  test("ignores regular lines", () => {
    const result = parseTodoMd("## Heading\nSome prose text", "TODO.md");
    expect(result).toHaveLength(0);
  });
});
