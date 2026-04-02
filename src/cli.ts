#!/usr/bin/env node
import cac from "cac";
import { loadConfig } from "./config.ts";
import { printResults } from "./output.ts";
import { scanFiles } from "./scanner.ts";

const cli = cac("tospudo");

cli.option("--max <number>", "Maximum number of TODOs before failing").help().version("1.0.0");

cli.parse();

if (cli.options.help || cli.options.version) {
  process.exit(0);
}

const config = await loadConfig();
const max = cli.options.max !== undefined ? Number(cli.options.max) : config?.max;

const todos = await scanFiles(config?.ignore ?? []);

printResults(todos, max, config?.maxLength);

if (max !== undefined && todos.length > max) {
  process.exit(1);
}
