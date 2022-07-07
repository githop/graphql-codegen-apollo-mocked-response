import { PluginFunction } from '@graphql-codegen/plugin-helpers';
import {
  concatAST,
  TypeInfo,
  GraphQLCompositeType,
  visitWithTypeInfo,
  visit,
  GraphQLOutputType,
  TypeNode,
  OperationDefinitionNode,
  DefinitionNode,
} from 'graphql';
import a from 'indefinite';

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

function hasListType(typeNode: TypeNode): boolean {
  if (typeNode.kind === 'ListType') {
    return true;
  }

  if (typeNode.kind === 'NamedType') {
    return false;
  }
  return hasListType(typeNode.type);
}

function buildQueryResult(
  transformedSelections: TransformedField[],
  config: Config,
  types = new Set<string>()
) {
  let ret = '';
  for (const node of transformedSelections) {
    if (node == transformedSelections[0] && config.addTypename) {
      ret += ` __typename: '${node.parentType}',`;
    }
    if (node.selections == null) {
      types.add(String(node.parentType));
      const mockInstance = mockInstanceName(`${node.parentType}`);
      ret += ` ${node.fieldName}: ${mockInstance}.${node.fieldName},`;
    } else {
      const [fields] = buildQueryResult(node.selections, config, types);
      const embed =
        node.kind === 'connection' ? `[{${fields}}]` : `{ ${fields} }`;
      ret += ` ${node.fieldName}: ${embed}, `;
    }
  }
  return [ret, [...types]] as const;
}

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

interface TransformedField {
  parentType: GraphQLCompositeType;
  type: GraphQLOutputType;
  fieldName: string;
  // primitive are scalars and connections are just embedded objects
  kind: 'primitive' | 'connection';
  selections?: Array<TransformedField>;
}

function handleOperationResult(
  operation: OperationDefinitionNode,
  config: Config
) {
  const functionName = `mock${operation.name?.value}`;
  const queryResultType = `${operation.name?.value}Query`;
  const queryVarsType = `${operation.name?.value}QueryVariables`;
  const documentNode = `${operation.name?.value}Document`;

  const transformedFields =
    (operation.selectionSet.selections as unknown as TransformedField[]) ?? [];

  const [resultFields, types] = buildQueryResult(transformedFields, config);

  const mocks = types
    .map((typeStr) => {
      const mockFn = mockFnName(typeStr, config.prefix);
      const mockInstance = mockInstanceName(typeStr);
      return `const ${mockInstance} = ${mockFn}();`;
    })
    .join('\n');

  const queryResultVar = `${operation.name?.value}Result`;
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
  const typeInfo = new TypeInfo(schema);

  const result = visit(
    docsAST,
    visitWithTypeInfo(typeInfo, {
      Field: {
        leave(node) {
          const parentType = typeInfo.getParentType()!;
          const type = typeInfo.getType()!;

          const transformed: TransformedField = {
            parentType,
            type,
            fieldName: node.name.value,
            selections: node.selectionSet?.selections as any[],
            kind: hasListType(typeInfo.getFieldDef()!.astNode!.type)
              ? 'connection'
              : 'primitive',
          };
          return transformed;
        },
      },
    })
  );

  const resolvedConfig = getConfig(config);

  function isOperationDefinitionPredicate(
    node: DefinitionNode,
    index: number,
    array: readonly DefinitionNode[]
  ): node is OperationDefinitionNode {
    return 'kind' in node && node.kind === 'OperationDefinition';
  }

  const templateVars = result.definitions
    .filter(isOperationDefinitionPredicate)
    .map((operation) => handleOperationResult(operation, resolvedConfig));

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
