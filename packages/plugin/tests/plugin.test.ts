import { plugin, getConfig, Config } from '../src';
import { describe, it, expect } from 'vitest';
import { isComplexPluginOutput, Types } from '@graphql-codegen/plugin-helpers';
import { loadDocuments, loadSchema } from '@graphql-tools/load';
import { resolve } from 'path';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';

describe('tests', () => {
  describe('config', () => {
    it('sets default values with no input', () => {
      const resolvedConfig = getConfig();
      expect(resolvedConfig).toEqual({
        typesFile: './types',
        addTypename: false,
      });
    });

    it('applies overrides', () => {
      const resolvedConfig = getConfig({
        typesFile: './foo/types.ts',
        addTypename: false,
        prefix: 'b',
      });
      expect(resolvedConfig).toEqual({
        typesFile: './foo/types',
        addTypename: false,
        prefix: 'b',
      });
    });

    it('merges a partial config with defaults', () => {
      const resolvedConfig = getConfig({
        addTypename: true,
      });
      expect(resolvedConfig).toEqual({
        typesFile: './types',
        addTypename: true,
      });
    });

    it('strips file ext from typesFile', () => {
      const resolvedConfig = getConfig({ typesFile: 'foo.ts' });
      expect(resolvedConfig.typesFile).toBe('foo');
    });

    it('should honor the prefix config', async () => {
      const result = await produceExpectArg({
        prefix: 'gth',
      });

      expect(result.content).toContain('const planetMock = gthPlanet()');
      expect(result.content).toContain('const locationMock = gthLocation()');
    });

    it('should honor the types file config', async () => {
      const result = await produceExpectArg({
        typesFile: './custom-types-file.ts',
      });

      expect(result.prepend).toContain(
        "import { ListPlanetsDocument, ListPlanetsQuery, ListPlanetsQueryVariables } from './custom-types-file'"
      );
    });

    it('should honor the addTypename config', async () => {
      const result = await produceExpectArg({ addTypename: true });
      expect(result.content).toContain(
        "const ListPlanetsResult: ListPlanetsQuery = { __typename: 'Query', listPlanets: [{ __typename: 'Planet', id: planetMock.id, type: planetMock.type, mass: planetMock.mass, name: planetMock.name, location: {  __typename: 'Location', id: locationMock.id, coordinates: locationMock.coordinates, },}],}"
      );
      expect(result.content).toMatchSnapshot();
    });
  });

  describe('plugin', () => {
    it('should produce valid output', async () => {
      const mocks = await produceExpectArg();

      expect(concatPluginOutput(mocks)).toMatchSnapshot();
    });

    it('should generate type imports', async () => {
      const result = await produceExpectArg();

      expect(result.prepend).toContain(
        "import { ApolloError } from '@apollo/client';"
      );
      expect(result.prepend).toContain(
        "import { MockedResponse } from '@apollo/client/testing';"
      );
      expect(result.prepend).toContain(
        "import { ListPlanetsDocument, ListPlanetsQuery, ListPlanetsQueryVariables } from './types'"
      );
    });

    it('should include the generic interface for the mock functions', async () => {
      const result = await produceExpectArg();

      expect(result.content).toContain('interface MockFn<Variables, Query');
    });

    it('should generate a valid query result', async () => {
      const result = await produceExpectArg();

      expect(result.content).toContain(
        'const ListPlanetsResult: ListPlanetsQuery = { listPlanets: [{ id: planetMock.id, type: planetMock.type, mass: planetMock.mass, name: planetMock.name, location: {  id: locationMock.id, coordinates: locationMock.coordinates, },}],}'
      );
    });
  });
});

interface GraphQLFiles {
  schemaFilename?: string;
  documentFilename?: string;
}

async function gatherFiles({ schemaFilename, documentFilename }: GraphQLFiles) {
  const schema = await loadSchema(
    resolve(
      process.cwd(),
      '../../',
      'example',
      'src',
      'graphql',
      schemaFilename || 'schema.graphql'
    ),
    {
      loaders: [new GraphQLFileLoader()],
    }
  );

  const document = await loadDocuments(
    resolve(
      process.cwd(),
      '../../',
      'example',
      'src',
      'graphql',
      documentFilename || 'document.graphql'
    ),
    {
      loaders: [new GraphQLFileLoader()],
    }
  );

  return { schema, document };
}

function concatPluginOutput(pluginOutput: Types.PluginOutput) {
  if (isComplexPluginOutput(pluginOutput)) {
    return pluginOutput.prepend?.join('\n') + pluginOutput.content;
  }
  return pluginOutput;
}

async function produceExpectArg(
  config?: Partial<Config>,
  files: GraphQLFiles = {}
) {
  const { schema, document } = await gatherFiles(files);
  const docs = [{ location: '', document: document[0].document }];
  const result = await plugin(schema, docs, config || {});
  return result as Types.ComplexPluginOutput;
}
