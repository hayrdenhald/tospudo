export const samples = {
  astro: "sample.astro",
  css: "sample.css",
  html: "sample.html",
  js: "sample.js",
  jsx: "sample.jsx",
  ts: "sample.ts",
  tsx: "sample.tsx",
  multiline: "multiline.ts",
  mixedcase: "mixedcase.ts",
  clean: "clean.ts",
  todo: "TODO.md",
} as const;

export type SampleFilename = (typeof samples)[keyof typeof samples];
