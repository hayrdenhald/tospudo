import pc from "picocolors";
import type { TodoItem } from "./parser.js";

const DEFAULT_MAX_LENGTH = 80;

function formatLocation(item: TodoItem): string {
  if (item.line !== undefined) {
    return `${item.file}:${item.line}`;
  }
  return item.file;
}

function truncate(text: string, limit: number): string {
  return text.length > limit ? `${text.slice(0, limit)} …` : text;
}

export function printResults(todos: TodoItem[], max?: number, maxLength?: number): void {
  const limit = maxLength ?? DEFAULT_MAX_LENGTH;
  const count = todos.length;

  if (count === 0) {
    console.log(pc.green("No TODOs found."));
  } else {
    console.log(pc.bold(`Found ${count} TODO${count === 1 ? "" : "s"}:\n`));

    const maxTextLength = Math.max(
      ...todos.map((t) => truncate(t.text, limit).length + (t.hasMore ? 2 : 0)),
    );

    for (const item of todos) {
      const location = formatLocation(item);
      const display = truncate(item.text, limit);
      const more = item.hasMore ? pc.dim(" …") : "";
      const textWidth = display.length + (item.hasMore ? 2 : 0);
      const padding = " ".repeat(Math.max(0, maxTextLength - textWidth + 4));
      console.log(`  ${display}${more}${padding}${pc.cyan(location)}`);
    }

    console.log("");
  }

  if (max !== undefined) {
    if (count > max) {
      console.log(pc.red(`Threshold: ${max} — EXCEEDED (${count}/${max}) ✗`));
    } else {
      console.log(pc.green(`Threshold: ${max} — OK ✓`));
    }
  }
}
