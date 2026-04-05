import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";
import ignore from "ignore";
import type { TodoItem } from "./parser.js";
import { parseFileForTodos, parseTodoMd } from "./parser.js";

async function loadGitignore(cwd: string): Promise<ReturnType<typeof ignore>> {
  const ig = ignore();
  const gitignorePath = join(cwd, ".gitignore");
  if (existsSync(gitignorePath)) {
    const content = await readFile(gitignorePath, "utf8");
    ig.add(content);
  }
  return ig;
}

export async function scanFiles(userIgnore: string[] = []): Promise<TodoItem[]> {
  const cwd = process.cwd();
  const ig = await loadGitignore(cwd);

  const globIgnore = ["node_modules/**", "**/node_modules/**", ".git/**", ...userIgnore];

  const files = await fg("**/*", {
    cwd,
    dot: true,
    ignore: globIgnore,
    onlyFiles: true,
  });

  const filteredFiles = files.filter((f) => !ig.ignores(f));

  const allTodos: TodoItem[] = [];

  for (const file of filteredFiles) {
    const absolutePath = join(cwd, file);
    const content = await readFile(absolutePath, "utf8");

    if (file === "TODO.md" || file.endsWith("/TODO.md")) {
      allTodos.push(...parseTodoMd(content, file));
    } else {
      allTodos.push(...parseFileForTodos(content, file));
    }
  }

  return allTodos;
}
