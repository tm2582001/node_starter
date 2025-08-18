import fs from 'node:fs';
import path from 'node:path';

import yaml from 'js-yaml';
import z from 'zod';

import getCurrentDir from './utils/directory-name.util.js';

type ReadConfigConfiguration = Record<string, unknown>;

class ReadConfig {
  configurations: ReadConfigConfiguration;
  constructor() {
    this.configurations = {};
  }

  addSource = (jsonData: ReadConfigConfiguration): ReadConfig => {
    this.configurations = { ...this.configurations, ...jsonData };
    return this;
  };

  addDefault = (name: string, value: any): ReadConfig => {
    if (value) {
      this.configurations[name] = value;
    }

    return this;
  };

  static readFile = (filename: string): ReadConfigConfiguration => {
    return yaml.load(
      fs.readFileSync(filename, 'utf-8'),
    ) as ReadConfigConfiguration;
  };

  static readFromEnvironment = (
    prefix: string,
    prefixSeparator: string,
    separator: string,
  ): ReadConfigConfiguration => {
    const config: ReadConfigConfiguration = {};

    for (const key in process.env) {
      if (key.startsWith(`${prefix}${prefixSeparator}`)) {
        let keyLevel1: string | null = null,
          keyLevel2: string | null = null;
        let configKey = key.replace('APP_', '');

        if (configKey.includes(separator)) {
          keyLevel1 = configKey.split('__')[0] ?? null;
          keyLevel2 = configKey.split('__')[1] ?? null;
        } else {
          keyLevel1 = configKey;
        }

        if (!keyLevel1) continue;

        if (keyLevel2) {
          if (!config[keyLevel1]) {
            config[keyLevel1] = {};
          }
          (config[keyLevel1] as Record<string, unknown>)[keyLevel2] =
            process.env[key];
        } else {
          config[keyLevel1] = process.env[key];
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
    lokiEndpointToken: z.string().optional()
  })
  .refine((data) => !data.loki || data.lokiUrl, {
    message: 'lokiUrl is required when loki is true',
    path: ['lokiUrl'],
  });

const configurationSchema = z.object({
  port: z.coerce.number().min(1000),
  logs: logsConfigurationSchema,
});

export type ConfigurationType = z.infer<typeof configurationSchema>;
export type LogsConfigurationType = z.infer<typeof logsConfigurationSchema>;

function buildConfig(): ConfigurationType {
  const __dirname = getCurrentDir(import.meta.url);

  const environment = process.env['NODE_ENV'] ?? 'local';

  const configurations = new ReadConfig()
    .addSource(
      ReadConfig.readFile(path.join(__dirname, '../configurations/base.yaml')),
    )
    .addSource(
      ReadConfig.readFile(
        path.join(__dirname, `../configurations/${environment}.yaml`),
      ),
    )
    .addSource(ReadConfig.readFromEnvironment('APP', '_', '__'))
    .addDefault('port', process.env['PORT']);

  const result = configurationSchema.safeParse(configurations.configurations);

  if (!result.success) {
    const errorMessage = result.error.issues
      .map((err) => `${err.path.join('.')}:${err.message}`)
      .join('\n  ');

    throw new Error(`Configuration validation failed:\n ${errorMessage}`);
  }

  console.log('configurations parse successfully', JSON.stringify(result.data));

  return result.data;
}

export default buildConfig;
