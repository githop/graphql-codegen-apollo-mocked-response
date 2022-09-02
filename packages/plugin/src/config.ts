import { RawConfig } from '@graphql-codegen/visitor-plugin-common';

export type Config = Pick<
  RawConfig,
  'namingConvention' | 'typesPrefix' | 'typesSuffix'
> & {
  typesFile: string;
  addTypename: boolean;
  prefix?: string;
};

export function getConfig(config?: Partial<Config>): Config {
  const baseConfig = new Map<string, any>([
    ['typesFile', './types.ts'],
    ['addTypename', false],
    ['namingConvention', 'change-case-all#pascalCase'],
    ['typesPrefix', null],
    ['typesSuffix', null],
  ]);

  const configMap = new Map<string, any>(Object.entries(config ?? {}));

  const resolved = new Map([...baseConfig, ...configMap]);
  // drop extension
  resolved.set('typesFile', resolved.get('typesFile')!.replace(/\.[\w]+$/, ''));
  return Object.fromEntries(resolved) as Config;
}
