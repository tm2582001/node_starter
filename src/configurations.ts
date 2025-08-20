import fs from "node:fs";
import path from "node:path";

import yaml from "js-yaml";
import z from "zod";

import getCurrentDir from "./utils/directory-name.util.js";

type ReadConfigConfiguration = Record<string, unknown>;

const toCamelCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

class ReadConfig {
  configurations: ReadConfigConfiguration;
  constructor() {
    this.configurations = {};
  }

  private deepMerge = (
    target: ReadConfigConfiguration,
    source: ReadConfigConfiguration,
  ): void => {
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (!target[key] || typeof target[key] !== "object") {
          target[key] = {};
        }
        this.deepMerge(
          target[key] as ReadConfigConfiguration,
          source[key] as ReadConfigConfiguration,
        );
      } else {
        target[key] = source[key];
      }
    }
  };

  addSource = (jsonData: ReadConfigConfiguration): ReadConfig => {
    this.deepMerge(this.configurations, jsonData);
    return this;
  };

  addDefault = (name: string, value: unknown): ReadConfig => {
    if (value) {
      this.configurations[name] = value;
    }

    return this;
  };

  static readFile = (filename: string): ReadConfigConfiguration => {
    return yaml.load(
      fs.readFileSync(filename, "utf-8"),
    ) as ReadConfigConfiguration;
  };

  static readFromEnvironment = (
    prefix: string,
    prefixSeparator: string,
    separator: string,
    snakeCaseSeparator?: string,
  ): ReadConfigConfiguration => {
    if (snakeCaseSeparator && snakeCaseSeparator === separator) {
      throw new Error("snakeCaseSeparator and separator cannot be the same");
    }

    const config: ReadConfigConfiguration = {};

    for (const key in process.env) {
      if (key.startsWith(`${prefix}${prefixSeparator}`)) {
        const configKey = key.replace(`${prefix}${prefixSeparator}`, "");
        const keyParts = configKey.split(separator).map((part) => {
          if (snakeCaseSeparator) {
            return toCamelCase(part);
          } else {
            return part.toLowerCase();
          }
        });

        if (keyParts.length === 0 || !keyParts[0]) continue;

        let current = config;

        for (let i = 0; i < keyParts.length - 1; i++) {
          const part = keyParts[i];
          if (!part) continue;

          if (!current[part] || typeof current[part] !== "object") {
            current[part] = {};
          }
          current = current[part] as Record<string, unknown>;
        }

        const lastKey = keyParts[keyParts.length - 1];
        if (lastKey) {
          current[lastKey] = process.env[key];
        }
      }
    }

    return config;
  };
}

const logsConfigurationSchema = z
  .object({
    terminal: z.coerce.boolean(),
    dailyRotateFile: z.coerce.boolean(),
    loki: z.coerce.boolean(),
    lokiUrl: z.url().optional(),
    lokiAppName: z.string().optional(),
    lokiEndpointToken: z.string().optional(),
  })
  .refine((data) => !data.loki || data.lokiUrl, {
    message: "lokiUrl is required when loki is true",
    path: ["lokiUrl"],
  });

const databaseConfigurationSchema = z.object({
  host: z.string(),
  username: z.string(),
  password: z.string(),
  connectionLimit: z.number().default(10),
  port: z.number().min(1000).default(3306),
});

const configurationSchema = z.object({
  port: z.coerce.number().min(1000),
  tenant: z.string(),
  workers: z.number().default(-1), // -1 or 0 or negative = use all CPUs
  database: databaseConfigurationSchema,
  logs: logsConfigurationSchema,
});

export type ConfigurationType = z.infer<typeof configurationSchema>;
export type LogsConfigurationType = z.infer<typeof logsConfigurationSchema>;

function buildConfig(): ConfigurationType {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __dirname = getCurrentDir(import.meta.url);

  const environment = process.env["NODE_ENV"] ?? "local";

  const configurations = new ReadConfig()
    .addSource(
      ReadConfig.readFile(path.join(__dirname, "../configurations/base.yaml")),
    )
    .addSource(
      ReadConfig.readFile(
        path.join(__dirname, `../configurations/${environment}.yaml`),
      ),
    )
    .addSource(ReadConfig.readFromEnvironment("APP", "_", "__", "_"))
    .addDefault("port", process.env["PORT"]);

  const result = configurationSchema.safeParse(configurations.configurations);

  if (!result.success) {
    const errorMessage = result.error.issues
      .map((err) => `${err.path.join(".")}:${err.message}`)
      .join("\n  ");

    throw new Error(`Configuration validation failed:\n ${errorMessage}`);
  }

  console.log(
    "[configuration.ts:131] configurations parse successfully",
    JSON.stringify(result.data),
  );

  return result.data;
}

export default buildConfig;
