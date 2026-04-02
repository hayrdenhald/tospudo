import { cosmiconfig } from "cosmiconfig";

export interface TospudoConfig {
  ignore?: string[];
  max?: number;
  maxLength?: number;
}

const explorer = cosmiconfig("tospudo", {
  searchPlaces: [
    "package.json",
    "tospudo.config.json",
    "tospudo.config.yaml",
    "tospudo.config.yml",
    "tospudo.config.ts",
  ],
  loaders: {
    ".ts": async (filepath: string) => {
      const mod = await import(filepath);
      return mod.default ?? mod;
    },
  },
});

export async function loadConfig(): Promise<TospudoConfig | null> {
  const result = await explorer.search();
  if (!result || result.isEmpty) return null;
  return result.config as TospudoConfig;
}
