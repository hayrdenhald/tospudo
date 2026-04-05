import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/cli.ts", "tests/**/*.ts"],
  project: ["src/**/*.ts", "tests/**/*.ts"],
  ignoreBinaries: ["only-allow"],
};

export default config;
