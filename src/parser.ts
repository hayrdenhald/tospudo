export interface TodoItem {
  file: string;
  line?: number;
  text: string;
  hasMore?: boolean;
}

const TODO_REGEX = /(?:(?:TODO|FIXME):|^\s*\*?\s*(?:TODO|FIXME)\b)/im;
const CHECKBOX_REGEX = /^- \[ \] (.+)$/;

function extractCommentContent(
  line: string,
  inBlockComment: boolean,
  inHtmlComment: boolean,
): { commentContent: string; inBlockComment: boolean; inHtmlComment: boolean } {
  let result = "";
  let pos = 0;

  while (pos < line.length) {
    if (inHtmlComment) {
      const close = line.indexOf("-->", pos);
      if (close === -1) {
        result += line.slice(pos);
        break;
      }
      result += line.slice(pos, close);
      inHtmlComment = false;
      pos = close + 3;
    } else if (inBlockComment) {
      const close = line.indexOf("*/", pos);
      if (close === -1) {
        result += line.slice(pos);
        break;
      }
      result += line.slice(pos, close);
      inBlockComment = false;
      pos = close + 2;
    } else {
      const slashSlash = line.indexOf("//", pos);
      const slashStar = line.indexOf("/*", pos);
      const htmlOpen = line.indexOf("<!--", pos);
      const candidates = [
        { idx: slashSlash, type: "line" as const },
        { idx: slashStar, type: "block" as const },
        { idx: htmlOpen, type: "html" as const },
      ]
        .filter((c) => c.idx !== -1)
        .sort((a, b) => a.idx - b.idx);
      const next = candidates[0];
      if (!next) break;
      if (next.type === "line") {
        result += line.slice(next.idx + 2);
        break;
      }
      if (next.type === "block") {
        inBlockComment = true;
        pos = next.idx + 2;
      }
      if (next.type === "html") {
        inHtmlComment = true;
        pos = next.idx + 4;
      }
    }
  }

  return { commentContent: result, inBlockComment, inHtmlComment };
}

export function parseFileForTodos(content: string, file: string): TodoItem[] {
  const lines = content.split("\n");
  const results: TodoItem[] = [];
  let inBlockComment = false;
  let inHtmlComment = false;

  for (let i = 0; i < lines.length; i++) {
    const {
      commentContent,
      inBlockComment: nextBlock,
      inHtmlComment: nextHtml,
    } = extractCommentContent(lines[i], inBlockComment, inHtmlComment);
    inBlockComment = nextBlock;
    inHtmlComment = nextHtml;

    if (!TODO_REGEX.test(commentContent)) continue;

    // NOTE: Find where the keyword starts to reconstruct "TODO: ..." from the keyword onwards
    const keywordMatch = /(?:TODO|FIXME)/i.exec(lines[i]);
    const raw = keywordMatch ? lines[i].slice(keywordMatch.index).trim() : lines[i].trim();
    const text = raw.replace(/\s*(?:\*\/|-->)\s*$/, "").trim();

    const nextLine = lines[i + 1];
    const hasMore =
      nextLine !== undefined &&
      extractCommentContent(nextLine, inBlockComment, inHtmlComment).commentContent.trim() !== "";

    results.push({ file, line: i + 1, text, hasMore });
  }

  return results;
}

export function parseTodoMd(content: string, file: string): TodoItem[] {
  const lines = content.split("\n");
  const results: TodoItem[] = [];

  for (const line of lines) {
    const match = CHECKBOX_REGEX.exec(line.trim());
    if (match) {
      results.push({
        file,
        text: match[1].trim(),
      });
    }
  }

  return results;
}
