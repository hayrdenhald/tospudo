import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const CLI = join(import.meta.dirname, "../../dist/cli.js");
const pkg = JSON.parse(readFileSync(join(import.meta.dirname, "../../package.json"), "utf8"));

let cwd: string;

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "tospudo-e2e-"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

function run(...args: string[]): { status: number | null; stdout: string } {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  return { status: result.status, stdout: result.stdout };
}

function write(file: string, content: string): void {
  const path = join(cwd, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function read(file: string): string {
  return readFileSync(join(cwd, file), "utf8");
}

describe("tospudo --version", () => {
  it("prints the package version", () => {
    const { status, stdout } = run("--version");
    expect(status).toBe(0);
    expect(stdout).toContain(pkg.version);
  });
});

describe("tospudo scan", () => {
  it("ignores comment markers and keywords inside strings", () => {
    write("a.ts", 'const url = "https://x.io/todo:1"; // TODO: real\n');
    write("b.ts", 'fg("**/*");\nconst o = { todo: 1 };\n');
    const { status, stdout } = run("scan");
    expect(status).toBe(0);
    expect(stdout).toContain("Found 1 TODO:");
    expect(stdout).toContain("TODO: real");
  });

  it("exits with 1 when --max is exceeded", () => {
    write("a.ts", "// TODO: one\n");
    const { status, stdout } = run("scan", "--max", "0");
    expect(status).toBe(1);
    expect(stdout).toContain("EXCEEDED");
  });

  it("respects the ignore option from the config file", () => {
    write("tospudo.config.json", JSON.stringify({ ignore: ["skip/**"] }));
    write("keep.ts", "// TODO: keep\n");
    write("skip/x.ts", "// TODO: skip\n");
    const { stdout } = run("scan");
    expect(stdout).toContain("keep.ts");
    expect(stdout).not.toContain("skip/x.ts");
  });
});

describe("tospudo list", () => {
  it("lists items from a CRLF TODO.md", () => {
    write("TODO.md", "## 🐛 fix\r\n\r\n- [ ] one\r\n- [x] two\r\n");
    const { status, stdout } = run("list");
    expect(status).toBe(0);
    expect(stdout).toContain("2 items");
    expect(stdout).toContain("one");
    expect(stdout).toContain("two");
  });
});

describe("tospudo add", () => {
  it("adds to the existing section and keeps CRLF line endings", () => {
    write("TODO.md", "## 🐛 fix\r\n\r\n- [ ] one\r\n- [x] two\r\n");
    const { status } = run("add", "Fix: three");
    expect(status).toBe(0);
    expect(read("TODO.md")).toBe("## 🐛 fix\r\n\r\n- [ ] one\r\n- [x] two\r\n- [ ] three\r\n");
  });

  it("creates TODO.md when it does not exist", () => {
    const { status } = run("add", "feat: x");
    expect(status).toBe(0);
    expect(read("TODO.md")).toBe("## ✨ feature\n\n- [ ] x\n");
  });
});
