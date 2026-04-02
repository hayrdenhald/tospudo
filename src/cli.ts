#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as p from "@clack/prompts";
import cac from "cac";
import pc from "picocolors";
import { loadConfig } from "./config.ts";
import { printResults } from "./output.ts";
import { scanFiles } from "./scanner.ts";
import {
  ANY_ITEM_REGEX,
  appendTodo,
  CHECKED_REGEX,
  completeLine,
  deleteLine,
  hasSections,
  migrateToSections,
  parseAllItems,
  parseAllItemsWithStatus,
  parseCompletedLines,
  parseLines,
  pruneEmptySections,
  SECTIONS,
  type Section,
  uncompleteLine,
} from "./todo-md.ts";

const TODO_PATH = join(process.cwd(), "TODO.md");

function readTodoMd(): Promise<string> {
  return readFile(TODO_PATH, "utf8");
}

async function runScan(options?: { max?: string }): Promise<void> {
  const config = await loadConfig();
  const max = options?.max !== undefined ? Number(options.max) : config?.max;
  const todos = await scanFiles(config?.ignore ?? []);
  printResults(todos, max, config?.maxLength);
  if (max !== undefined && todos.length > max) {
    process.exit(1);
  }
}

async function runList(): Promise<void> {
  if (!existsSync(TODO_PATH)) {
    p.cancel("No TODO.md found in current directory.");
    process.exit(1);
  }
  const content = await readTodoMd();
  const items = parseAllItemsWithStatus(content);
  if (items.length === 0) {
    console.log(pc.green("No TODOs found in TODO.md."));
  } else {
    console.log(pc.bold(`\nTODO.md (${items.length} item${items.length === 1 ? "" : "s"}):`));
    for (const line of content.split("\n")) {
      const sectionMatch = /^## (.+)$/.exec(line);
      const itemMatch = ANY_ITEM_REGEX.exec(line);
      if (sectionMatch) {
        console.log(pc.bold(`\n  ${sectionMatch[1]}`));
      } else if (itemMatch) {
        const checked = CHECKED_REGEX.test(line);
        const checkbox = checked ? pc.green("[x]") : pc.dim("[ ]");
        const text = checked ? pc.dim(itemMatch[1].trim()) : itemMatch[1].trim();
        console.log(`  ${checkbox} ${text}`);
      }
    }
    console.log("");
  }
  const config = await loadConfig();
  const allTodos = await scanFiles(config?.ignore ?? []);
  const codeTodos = allTodos.filter((t) => t.file !== "TODO.md" && !t.file.endsWith("/TODO.md"));
  if (codeTodos.length > 0) {
    const n = codeTodos.length;
    console.log(
      pc.dim(
        `  ... ${items.length === 0 ? "but" : "and"} ${n} TODO${n === 1 ? "" : "s"} spread around the rest of the codebase.`,
      ),
    );
    console.log("");
  }
}

function parseSectionPrefix(text: string): { section: Section; todoText: string } | null {
  const match = /^(\w+):\s*(.+)$/.exec(text);
  if (!match) return null;
  const candidate = match[1];
  if (!(SECTIONS as readonly string[]).includes(candidate)) return null;
  return { section: candidate as Section, todoText: match[2].trim() };
}

async function runAdd(text?: string): Promise<void> {
  const config = await loadConfig();
  const emoji = config?.sectionEmojis !== false;
  let existing = existsSync(TODO_PATH) ? await readTodoMd() : "";
  if (existing.length > 0 && !hasSections(existing)) {
    existing = migrateToSections(existing, emoji);
  }
  let todoText = text?.trim();
  if (!todoText) {
    const input = await p.text({ message: "What needs to be done?" });
    if (p.isCancel(input)) process.exit(0);
    todoText = (input as string).trim();
    if (!todoText) {
      p.cancel("TODO text cannot be empty.");
      process.exit(1);
    }
  }
  const parsed = parseSectionPrefix(todoText);
  let section: Section;
  if (parsed) {
    section = parsed.section;
    todoText = parsed.todoText;
  } else {
    const selected = await p.select({
      message: "Which section?",
      options: SECTIONS.map((s) => ({ value: s, label: s })),
    });
    if (p.isCancel(selected)) process.exit(0);
    section = selected as Section;
  }
  await writeFile(TODO_PATH, appendTodo(existing, todoText, section, emoji), "utf8");
  p.outro(`Added: ${todoText}`);
}

async function runCheck(): Promise<void> {
  if (!existsSync(TODO_PATH)) {
    p.cancel("No TODO.md found in current directory.");
    process.exit(1);
  }
  const content = await readTodoMd();
  const items = parseLines(content);
  if (items.length === 0) {
    p.cancel("No unchecked TODOs found.");
    process.exit(1);
  }
  const selected = await p.autocomplete({
    message: "Select a TODO to check off:",
    options: items.map((item) => ({ label: item.text, value: item.index })),
  });
  if (p.isCancel(selected)) process.exit(0);
  await writeFile(TODO_PATH, completeLine(content, selected as number), "utf8");
  p.outro(`Checked: ${items.find((i) => i.index === selected)?.text}`);
}

async function runUncheck(): Promise<void> {
  if (!existsSync(TODO_PATH)) {
    p.cancel("No TODO.md found in current directory.");
    process.exit(1);
  }
  const content = await readTodoMd();
  const items = parseCompletedLines(content);
  if (items.length === 0) {
    p.cancel("No checked TODOs found.");
    process.exit(1);
  }
  const selected = await p.autocomplete({
    message: "Select a TODO to uncheck:",
    options: items.map((item) => ({ label: item.text, value: item.index })),
  });
  if (p.isCancel(selected)) process.exit(0);
  await writeFile(TODO_PATH, uncompleteLine(content, selected as number), "utf8");
  p.outro(`Unchecked: ${items.find((i) => i.index === selected)?.text}`);
}

async function runRemove(): Promise<void> {
  if (!existsSync(TODO_PATH)) {
    p.cancel("No TODO.md found in current directory.");
    process.exit(1);
  }
  const content = await readTodoMd();
  const items = parseAllItems(content);
  if (items.length === 0) {
    p.cancel("No TODOs found.");
    process.exit(1);
  }
  const selected = await p.autocomplete({
    message: "Select a TODO to remove:",
    options: items.map((item) => ({ label: item.text, value: item.index })),
  });
  if (p.isCancel(selected)) process.exit(0);
  await writeFile(TODO_PATH, pruneEmptySections(deleteLine(content, selected as number)), "utf8");
  p.outro(`Removed: ${items.find((i) => i.index === selected)?.text}`);
}

const cli = cac("tospudo");

cli
  .command("scan", "Scan for TODOs across the codebase")
  .option("--max <number>", "Maximum number of TODOs before failing")
  .action(runScan);

cli.command("list", "List TODOs in TODO.md").action(runList);

cli.command("add [text]", "Add a new TODO to TODO.md").action(runAdd);

cli.command("check", "Check off a TODO").action(runCheck);

cli.command("uncheck", "Uncheck a completed TODO").action(runUncheck);

cli.command("remove", "Remove a TODO").action(runRemove);

cli.command("", "Interactive menu").action(async () => {
  const action = await p.select({
    message: "What would you like to do?",
    options: [
      { value: "scan", label: "Scan codebase for TODOs" },
      { value: "list", label: "List TODOs in TODO.md" },
      { value: "add", label: "Add a TODO to TODO.md" },
      { value: "check", label: "Check off a TODO" },
      { value: "uncheck", label: "Uncheck a TODO" },
      { value: "remove", label: "Remove a TODO" },
    ],
  });
  if (p.isCancel(action)) process.exit(0);
  if (action === "scan") await runScan();
  if (action === "list") await runList();
  if (action === "add") await runAdd();
  if (action === "check") await runCheck();
  if (action === "uncheck") await runUncheck();
  if (action === "remove") await runRemove();
});

cli.help();
cli.version("1.0.0");
cli.parse();
