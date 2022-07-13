import { PluginFunction } from '@graphql-codegen/plugin-helpers';
import {
  concatAST,
  TypeInfo,
  GraphQLCompositeType,
  visitWithTypeInfo,
  visit,
  TypeNode,
  OperationDefinitionNode,
  FragmentDefinitionNode,
  SelectionSetNode,
  FragmentSpreadNode,
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

type Foo =
  | Omit<TransformedField, 'selections'>
  | FragmentSpreadNode
  | TransformedField;

function walkSelections(transformedFields: Foo[], fragmentMap: FragmentMap) {
  let ret = '';

  for (const tf of transformedFields) {
    if (
      ('selections' in tf && tf.selections != null) ||
      tf.kind === 'FragmentSpread'
    ) {
      let selections = [];

      if (tf.kind === 'FragmentSpread') {
        selections = fragmentMap.get(tf.name.value)!.selectionSet
          .selections as any;
      } else {
        selections = tf.selections as any;
      }

      const foo = walkSelections(selections as any, fragmentMap);

      const embed =
        tf.kind === 'connection' || tf.kind === 'FragmentSpread'
          ? `[{${foo}}]`
          : `{ ${foo} }`;
      ret += ` ${(tf as any).fieldName}: ${embed}, `;
    } else {
      const mockInstance = mockInstanceName(tf.parentTypename);
      ret += ` ${tf.fieldName}: ${mockInstance}.${tf.fieldName},`;
    }
  }

  return ret;
}

function buildQueryResult(
  transformedSelections: TransformedField[],
  fragmentMap: FragmentMap,
  config: Config,
  types = new Set<string>()
): readonly [string, readonly string[]] {
  let ret = '';
  for (const node of transformedSelections) {
    if (node == transformedSelections[0] && config.addTypename) {
      ret += ` __typename: '${node.parentTypename}',`;
    }

    if (node.kind === ('FragmentSpread' as any)) {
      const fragment = node as unknown as FragmentDefinitionNode;

      const fields = fragmentMap.get(fragment.name.value)?.selectionSet!
        .selections as any;

      return buildQueryResult(fields, fragmentMap, config, types);
    }

    if (node.selections == null) {
      types.add(node.parentTypename);
      const mockInstance = mockInstanceName(node.parentTypename);
      ret += ` ${node.fieldName}: ${mockInstance}.${node.fieldName},`;
    } else {
      const [fields] = buildQueryResult(
        node.selections as any,
        fragmentMap,
        config,
        types
      );
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

type FragmentMap = Map<string, FragmentDefinitionNode>;

interface TransformedField {
  parentTypename: string;
  fieldName: string;
  // primitive are scalars and connections are just embedded objects
  kind: 'primitive' | 'connection';
  selections?: Array<TransformedField | FragmentSpreadNode>;
}

function handleOperationResult(
  operation: OperationDefinitionNode,
  fragmentMap: FragmentMap,
  config: Config
) {
  const functionName = `mock${operation.name?.value}`;
  const queryResultType = `${operation.name?.value}Query`;
  const queryVarsType = `${operation.name?.value}QueryVariables`;
  const documentNode = `${operation.name?.value}Document`;

  const transformedFields =
    (operation.selectionSet.selections as unknown as TransformedField[]) ?? [];

  const [resultFields, types] = buildQueryResult(
    transformedFields,
    fragmentMap,
    config
  );

  const huh = walkSelections(transformedFields, fragmentMap);

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
          const parentTypename = typeInfo.getParentType()!.name;
          const transformed: TransformedField = {
            parentTypename,
            fieldName: node.name.value,
            kind: hasListType(typeInfo.getFieldDef()!.astNode!.type)
              ? 'connection'
              : 'primitive',
            selections: node.selectionSet?.selections as any[],
          };
          return transformed;
        },
      },
    })
  );

  const resolvedConfig = getConfig(config);

  const operations = [];
  const fragmentMap: FragmentMap = new Map();

  for (const node of result.definitions) {
    if (node.kind === 'OperationDefinition') {
      operations.push(node);
    }

    if (node.kind === 'FragmentDefinition') {
      fragmentMap.set(node.name.value, node);
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
