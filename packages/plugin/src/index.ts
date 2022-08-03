import { PluginFunction } from '@graphql-codegen/plugin-helpers';
import { concatAST, Kind } from 'graphql';
import a from 'indefinite';
import {
  InlinedSelectionSet,
  isTransformedField,
  isTransformedFragment,
  isTransformedOperation,
  TargetField,
  TargetSelectionSet,
  VisitedFragment,
  VisitedOperation,
  VisitedSelections,
  VisitedSelectionSet,
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

interface BuildResultsStr {
  selections: TargetField[];
  addTypename: boolean;
}

function buildResultStr({ selections, addTypename }: BuildResultsStr): string {
  let ret = '';
  for (const node of selections) {
    if (node === selections[0] && addTypename) {
      ret += ` __typename: '${node.parentTypename}',`;
    }

    if (node.selections == null) {
      const mockInstance = mockInstanceName(node.parentTypename);
      ret += ` ${node.fieldName}: ${mockInstance}.${node.fieldName},`;
    } else {
      const fieldsStr = buildResultStr({
        selections: node.selections,
        addTypename,
      });
      const embed =
        node.kind === 'connection' ? `[{${fieldsStr}}]` : `{ ${fieldsStr} }`;
      ret += ` ${node.fieldName}: ${embed},`;
    }
  }
  return ret;
}

type FragmentMap = Map<string, VisitedFragment>;

interface CollectTypes {
  selections: VisitedSelections;
  fragmentMap: FragmentMap;
  types?: Set<string>;
}

function collectTypes({
  selections,
  fragmentMap,
  types = new Set(),
}: CollectTypes) {
  for (const field of selections) {
    if (isTransformedField(field)) {
      if (field.selections == null) {
        types.add(field.parentTypename);
      } else {
        collectTypes({ selections: field.selections, fragmentMap, types });
      }
    } else {
      const { selections } = fragmentMap.get(field.name)!;
      collectTypes({ selections, fragmentMap, types });
    }
  }

  return [...types];
}

function inlineFragments(
  selectionSet: VisitedSelectionSet,
  fragmentMap: FragmentMap
): InlinedSelectionSet | null {
  if (selectionSet == null) {
    return null;
  }
  const { selections, ...rest } = selectionSet;
  const next = { ...rest } as any;

  if (selections || next.kind === Kind.FRAGMENT_SPREAD) {
    const fragment = fragmentMap.get(next.name)!;
    const nextSelections = selections || fragment.selections!;

    next['selections'] = nextSelections.map((node) =>
      inlineFragments(node as any, fragmentMap)
    );
  }

  return next;
}

function liftFragmentSelections(
  selectionSet: InlinedSelectionSet
): TargetSelectionSet | null {
  if (selectionSet == null) {
    return null;
  }

  const { selections, ...rest } = selectionSet;

  const next = { ...rest } as any;
  if (selections) {
    const nextSelections = [];
    for (const node of selections) {
      if (node.kind === Kind.FRAGMENT_SPREAD) {
        nextSelections.push(...node.selections);
      } else {
        nextSelections.push(node);
      }
    }
    next['selections'] = nextSelections.map((node) =>
      liftFragmentSelections(node as any)
    );
  }
  return next;
}

function handleOperationResult(
  node: VisitedOperation,
  fragmentMap: FragmentMap,
  { prefix, addTypename }: Config
) {
  const operation = node.operation[0].toUpperCase() + node.operation.slice(1);
  const functionName = `mock${node.name}`;
  const queryResultType = `${node.name}${operation}`;
  const queryVarsType = `${node.name}${operation}Variables`;
  const documentNode = `${node.name}Document`;

  const inlinedFragments = inlineFragments(node.selectionSet, fragmentMap)!;
  const { selections } = liftFragmentSelections(inlinedFragments)!;
  const types = collectTypes({ selections, fragmentMap });
  const resultFields = buildResultStr({
    selections,
    addTypename,
  });

  const mocks = types
    .map((typeStr) => {
      const mockFn = mockFnName(typeStr, prefix);
      const mockInstance = mockInstanceName(typeStr);
      return `const ${mockInstance} = ${mockFn}();`;
    })
    .join('\n');

  const queryResultVar = `${node.name}Result`;
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

  const operations: VisitedOperation[] = [];
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
