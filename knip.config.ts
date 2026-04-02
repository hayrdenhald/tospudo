import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/config.ts"],
  project: ["src/**/*.ts"],
  ignoreBinaries: ["only-allow"],
};

export default config;
