import { PluginFunction } from '@graphql-codegen/plugin-helpers';
export interface Config {
    typesFile: string;
    addTypename: boolean;
    prefix?: string;
}
export declare function getConfig(config?: Partial<Config>): Config;
export declare const plugin: PluginFunction<Partial<Config>>;
