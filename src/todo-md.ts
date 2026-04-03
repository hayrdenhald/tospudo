const UNCHECKED_REGEX = /^- \[ \] (.+)$/;
export const CHECKED_REGEX = /^- \[x\] (.+)$/i;
export const ANY_ITEM_REGEX = /^- \[.?\] (.+)$/;

export const SECTIONS = [
  "fix",
  "feature",
  "refactor",
  "test",
  "chore",
  "ci",
  "style",
  "build",
  "perf",
] as const;

export type Section = (typeof SECTIONS)[number];

const SECTION_EMOJIS: Record<Section, string> = {
  fix: "🐛",
  feature: "✨",
  refactor: "♻️",
  test: "🧪",
  chore: "🧹",
  ci: "🚀",
  style: "💅",
  build: "📦",
  perf: "⚡",
};

function sectionHeading(section: Section, emoji: boolean): string {
  return emoji ? `## ${SECTION_EMOJIS[section]} ${section}` : `## ${section}`;
}

/** Matches a section heading line for a given section name, with or without emoji. */
function matchesSectionHeading(line: string, section: Section): boolean {
  return line === `## ${section}` || (line.startsWith(`## `) && line.endsWith(` ${section}`));
}

export function hasSections(content: string): boolean {
  return content.split("\n").some((line) => /^## \S/.test(line));
}

export function migrateToSections(content: string, emoji = true): string {
  const lines = content.split("\n");
  const checkboxLines = lines.filter((line) => ANY_ITEM_REGEX.test(line));
  if (checkboxLines.length === 0) return content;
  return `${sectionHeading("fix", emoji)}\n\n${checkboxLines.join("\n")}\n`;
}

export function parseLines(content: string): { index: number; text: string }[] {
  return content.split("\n").flatMap((line, index) => {
    const match = UNCHECKED_REGEX.exec(line);
    return match ? [{ index, text: match[1].trim() }] : [];
  });
}

export function parseCompletedLines(content: string): { index: number; text: string }[] {
  return content.split("\n").flatMap((line, index) => {
    const match = CHECKED_REGEX.exec(line);
    return match ? [{ index, text: match[1].trim() }] : [];
  });
}

export function parseAllItems(content: string): { index: number; text: string }[] {
  return content.split("\n").flatMap((line, index) => {
    const match = ANY_ITEM_REGEX.exec(line);
    return match ? [{ index, text: match[1].trim() }] : [];
  });
}

export function parseAllItemsWithStatus(
  content: string,
): { index: number; text: string; checked: boolean }[] {
  return content.split("\n").flatMap((line, index) => {
    const match = ANY_ITEM_REGEX.exec(line);
    if (!match) return [];
    return [{ index, text: match[1].trim(), checked: CHECKED_REGEX.test(line) }];
  });
}

function assertValidIndex(index: number, length: number): void {
  if (index < 0 || index >= length) {
    throw new RangeError(`Line index ${index} is out of bounds (file has ${length} lines)`);
  }
}

export function uncompleteLine(content: string, index: number): string {
  const lines = content.split("\n");
  assertValidIndex(index, lines.length);
  lines[index] = lines[index].replace(/^- \[x\] /i, "- [ ] ");
  return lines.join("\n");
}

export function completeLine(content: string, index: number): string {
  const lines = content.split("\n");
  assertValidIndex(index, lines.length);
  lines[index] = lines[index].replace("- [ ]", "- [x]");
  return lines.join("\n");
}

export function deleteLine(content: string, index: number): string {
  const lines = content.split("\n");
  assertValidIndex(index, lines.length);
  lines.splice(index, 1);
  return lines.join("\n");
}

export function pruneEmptySections(content: string): string {
  const lines = content.split("\n");
  const keep: boolean[] = new Array(lines.length).fill(true);

  for (let i = 0; i < lines.length; i++) {
    if (!/^## \S/.test(lines[i])) continue;
    // Find the end of this section (next ## heading or EOF)
    let nextSection = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^## \S/.test(lines[j])) {
        nextSection = j;
        break;
      }
    }
    // Check if section has any checkbox items
    const hasItems = lines.slice(i + 1, nextSection).some((l) => ANY_ITEM_REGEX.test(l));
    if (!hasItems) {
      // Remove the header and any blank lines immediately after it up to the next section
      for (let j = i; j < nextSection; j++) {
        keep[j] = false;
      }
    }
  }

  const result = lines.filter((_, i) => keep[i]).join("\n");
  // Collapse 3+ consecutive blank lines into 2
  return result.replace(/\n{3,}/g, "\n\n");
}

export function appendTodo(content: string, text: string, section?: Section, emoji = true): string {
  if (!section) {
    const trimmed = content.trimEnd();
    const base = trimmed.length > 0 ? `${trimmed}\n` : "";
    return `${base}- [ ] ${text}\n`;
  }

  const lines = content.split("\n");
  const sectionStartIndex = lines.findIndex((line) => matchesSectionHeading(line, section));

  if (sectionStartIndex === -1) {
    const trimmed = content.trimEnd();
    const base = trimmed.length > 0 ? `${trimmed}\n` : "";
    return `${base}\n${sectionHeading(section, emoji)}\n\n- [ ] ${text}\n`;
  }

  const nextSectionIndex = lines.findIndex(
    (line, i) => i > sectionStartIndex && /^## \S/.test(line),
  );
  const blockEnd = nextSectionIndex === -1 ? lines.length : nextSectionIndex;

  let lastItemIndex = -1;
  for (let i = sectionStartIndex + 1; i < blockEnd; i++) {
    if (/^- \[/.test(lines[i])) lastItemIndex = i;
  }

  const insertAfter =
    lastItemIndex !== -1
      ? lastItemIndex
      : lines[sectionStartIndex + 1] === ""
        ? sectionStartIndex + 1
        : sectionStartIndex;

  lines.splice(insertAfter + 1, 0, `- [ ] ${text}`);
  return lines.join("\n");
}
