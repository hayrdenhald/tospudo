import { cosmiconfig } from "cosmiconfig";
import { z } from "zod";

export const ConfigSchema = z.object({
  ignore: z.array(z.string()).optional(),
  max: z.number().int().positive().optional(),
  maxLength: z.number().int().positive().optional(),
  sectionEmojis: z.boolean().optional(),
});

type TospudoConfig = z.infer<typeof ConfigSchema>;

const explorer = cosmiconfig("tospudo", {
  searchPlaces: [
    "package.json",
    "tospudo.config.json",
    "tospudo.config.yaml",
    "tospudo.config.yml",
  ],
});

export async function loadConfig(): Promise<TospudoConfig | null> {
  const result = await explorer.search();
  if (!result || result.isEmpty) return null;
  const parsed = ConfigSchema.safeParse(result.config);
  if (!parsed.success) {
    throw new Error(`Invalid tospudo config: ${parsed.error.message}`);
  }
  return parsed.data;
}
