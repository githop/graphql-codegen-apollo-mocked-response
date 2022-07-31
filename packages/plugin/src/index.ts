import { PluginFunction } from '@graphql-codegen/plugin-helpers';
import { concatAST } from 'graphql';
import a from 'indefinite';
import {
  isTransformedField,
  isTransformedFragment,
  isTransformedOperation,
  TransformedFragment,
  TransformedOperation,
  TransformedSelections,
  visitor,
} from './visitor';

const APOLLO_IMPORTS = [
  "import { ApolloError } from '@apollo/client';",
  "import { MockedResponse } from '@apollo/client/testing';",
];

const MOCK_FN_INTERFACE = `
  interface MockFn<Variables, Query> {
    ({
      variables,
      result,
      error,
    }: {
      variables?: Variables;
      result?: Query;
      error?: ApolloError;
    }): MockedResponse<Query>;
  }  
  `;

interface BuildMockFn {
  queryResultType: string;
  queryVarsType: string;
  functionName: string;
  documentNode: string;
  queryResult: string;
  queryResultVar: string;
  mocks: string;
}

function mockFnTemplate({
  functionName,
  queryVarsType,
  queryResultType,
  documentNode,
  queryResult,
  queryResultVar,
  mocks,
}: BuildMockFn) {
  return `
  export const ${functionName}: MockFn<
  ${queryVarsType},
  ${queryResultType}
> = ({ result, variables, error }) => {
  ${mocks}

  ${queryResult}

  return {
    request: {
      query: ${documentNode},
      variables,
    },
    result: {
      data: result != null ? result : ${queryResultVar},
      error,
    },
  };
};
  `;
}

function mockFnName(type: string, prefix?: string) {
  if (prefix) {
    return `${prefix}${type}`;
  }
  return a(type, { articleOnly: true }) + type;
}

function mockInstanceName(type: string) {
  return type[0].toLowerCase() + type.substring(1) + 'Mock';
}

type FragmentMap = Map<string, TransformedFragment>;

function buildResultStr(
  transformedFields: TransformedSelections,
  fragmentMap: FragmentMap,
  addTypename: boolean
): string {
  let ret = '';
  for (const node of transformedFields) {
    if (isTransformedField(node)) {
      if (node.selections == null) {
        const mockInstance = mockInstanceName(node.parentTypename);
        ret += ` ${node.fieldName}: ${mockInstance}.${node.fieldName},`;
      } else {
        const fieldsStr = buildResultStr(
          node.selections,
          fragmentMap,
          addTypename
        );
        const embed =
          node.kind === 'connection' ? `[{${fieldsStr}}]` : `{ ${fieldsStr} }`;
        ret += ` ${node.fieldName}: ${embed},`;
      }
    } else {
      const fragment = fragmentMap.get(node.name);
      const part = buildResultStr(
        fragment?.selections!,
        fragmentMap,
        addTypename
      );
      ret += part;
    }
  }
  return ret;
}

function collectTypes(
  transformedFields: TransformedSelections,
  fragmentMap: FragmentMap,
  types = new Set<string>()
) {
  for (const field of transformedFields) {
    if (isTransformedField(field)) {
      if (field.selections == null) {
        types.add(field.parentTypename);
      } else {
        collectTypes(field.selections, fragmentMap, types);
      }
    } else {
      const fragment = fragmentMap.get(field.name);
      collectTypes(fragment?.selections!, fragmentMap, types);
    }
  }

  return [...types];
}

function handleOperationResult(
  operation: TransformedOperation,
  fragmentMap: FragmentMap,
  { prefix, addTypename }: Config
) {
  const functionName = `mock${operation.name}`;
  const queryResultType = `${operation.name}Query`;
  const queryVarsType = `${operation.name}QueryVariables`;
  const documentNode = `${operation.name}Document`;

  const transformed = operation.selectionSet.selections ?? [];

  const types = collectTypes(transformed, fragmentMap);
  const resultFields = buildResultStr(transformed, fragmentMap, addTypename);

  const mocks = types
    .map((typeStr) => {
      const mockFn = mockFnName(typeStr, prefix);
      const mockInstance = mockInstanceName(typeStr);
      return `const ${mockInstance} = ${mockFn}();`;
    })
    .join('\n');

  const queryResultVar = `${operation.name}Result`;
  const queryResult = `const ${queryResultVar}: ${queryResultType} = {${resultFields}}`;
  const templateVars = {
    functionName,
    queryResultType,
    queryVarsType,
    mocks,
    queryResult,
    documentNode,
    queryResultVar,
  };

  const imports = [documentNode, queryResultType, queryVarsType];

  return {
    templateVars,
    imports,
  };
}

export interface Config {
  typesFile: string;
  addTypename: boolean;
  prefix?: string;
}

export function getConfig(config?: Partial<Config>): Config {
  const baseConfig: Config = {
    typesFile: './types.ts',
    addTypename: false,
  };
  const resolved = Object.assign(baseConfig, config);
  // drop extension
  resolved.typesFile = resolved.typesFile.replace(/\.[\w]+$/, '');
  return resolved;
}

export const plugin: PluginFunction<Partial<Config>> = (
  schema,
  documents,
  config
) => {
  const docsAST = concatAST(documents.map((v) => v.document!));

  const result = visitor(docsAST, schema);
  const resolvedConfig = getConfig(config);

  const operations: TransformedOperation[] = [];
  const fragmentMap: FragmentMap = new Map();

  for (const node of result.definitions) {
    if (isTransformedOperation(node)) {
      operations.push(node);
    }

    if (isTransformedFragment(node)) {
      fragmentMap.set(node.name, node);
    }
  }

  const templateVars = operations.map((operation) =>
    handleOperationResult(operation, fragmentMap, resolvedConfig)
  );

  const typeImports = templateVars.flatMap(({ imports }) => imports);

  const imports = [
    ...APOLLO_IMPORTS,
    `import { ${typeImports.join(', ')} } from '${resolvedConfig.typesFile}'`,
  ];

  const lines: string[] = [MOCK_FN_INTERFACE];

  return {
    prepend: imports,
    content: lines
      .concat(
        templateVars.map(({ templateVars }) => mockFnTemplate(templateVars))
      )
      .join('\n'),
  };
};

function prettyPrint(thing: any, label?: string) {
  if (label) {
    console.log(label, JSON.stringify(thing, null, 2));
    return;
  }
  console.log(JSON.stringify(thing, null, 2));
}
