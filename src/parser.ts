import { UNCHECKED_REGEX } from "./todo-md.js";

export interface TodoItem {
  file: string;
  line?: number;
  text: string;
  hasMore?: boolean;
}

const TODO_REGEX = /(?:\b(?:TODO|FIXME):|^\s*\*?\s*(?:TODO|FIXME)\b)/i;
const KEYWORD_REGEX = /\b(?:TODO|FIXME)\b/i;
const QUOTES = new Set(["'", '"', "`"]);
const WORD_CHAR_REGEX = /\w/;

function findStringEnd(line: string, start: number): number {
  const quote = line[start];
  let pos = start + 1;
  while (pos < line.length) {
    if (line[pos] === "\\") {
      pos += 2;
      continue;
    }
    if (line[pos] === quote) return pos + 1;
    pos++;
  }
  return -1;
}

function extractCommentContent(
  line: string,
  inBlockComment: boolean,
  inHtmlComment: boolean,
): { segments: string[]; inBlockComment: boolean; inHtmlComment: boolean } {
  const segments: string[] = [];
  let pos = 0;

  while (pos < line.length) {
    if (inHtmlComment) {
      const close = line.indexOf("-->", pos);
      if (close === -1) {
        segments.push(line.slice(pos));
        break;
      }
      segments.push(line.slice(pos, close));
      inHtmlComment = false;
      pos = close + 3;
    } else if (inBlockComment) {
      const close = line.indexOf("*/", pos);
      if (close === -1) {
        segments.push(line.slice(pos));
        break;
      }
      segments.push(line.slice(pos, close));
      inBlockComment = false;
      pos = close + 2;
    } else if (QUOTES.has(line[pos]) && !WORD_CHAR_REGEX.test(line[pos - 1] ?? "")) {
      // NOTE: The scanner also feeds HTML/Markdown prose, so a quote after a word char ("Don't") is an apostrophe.
      const end = findStringEnd(line, pos);
      pos = end === -1 ? pos + 1 : end;
    } else if (line.startsWith("//", pos)) {
      segments.push(line.slice(pos + 2));
      break;
    } else if (line.startsWith("/*", pos)) {
      inBlockComment = true;
      pos += 2;
    } else if (line.startsWith("<!--", pos)) {
      inHtmlComment = true;
      pos += 4;
    } else {
      pos++;
    }
  }

  return { segments, inBlockComment, inHtmlComment };
}

export function parseFileForTodos(content: string, file: string): TodoItem[] {
  const lines = content.split(/\r?\n/);
  const results: TodoItem[] = [];
  let inBlockComment = false;
  let inHtmlComment = false;

  for (let i = 0; i < lines.length; i++) {
    const {
      segments,
      inBlockComment: nextBlock,
      inHtmlComment: nextHtml,
    } = extractCommentContent(lines[i], inBlockComment, inHtmlComment);
    inBlockComment = nextBlock;
    inHtmlComment = nextHtml;

    const segment = segments.find((s) => TODO_REGEX.test(s));
    if (segment === undefined) continue;

    // NOTE: Find where the keyword starts to reconstruct "TODO: ..." from the keyword onwards
    const keywordIndex = KEYWORD_REGEX.exec(segment)?.index ?? 0;
    const text = segment.slice(keywordIndex).trim();

    const nextLine = lines[i + 1];
    const hasMore =
      nextLine !== undefined &&
      extractCommentContent(nextLine, inBlockComment, inHtmlComment).segments.join("").trim() !==
        "";

    results.push({ file, line: i + 1, text, hasMore });
  }

  return results;
}

export function parseTodoMd(content: string, file: string): TodoItem[] {
  const lines = content.split(/\r?\n/);
  const results: TodoItem[] = [];

  for (const line of lines) {
    const match = UNCHECKED_REGEX.exec(line);
    if (match) {
      results.push({
        file,
        text: match[1].trim(),
      });
    }
  }

  return results;
}
