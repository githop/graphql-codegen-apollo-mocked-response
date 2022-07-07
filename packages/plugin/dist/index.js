'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.plugin = exports.getConfig = void 0;
const graphql_1 = require('graphql');
const indefinite_1 = __importDefault(require('indefinite'));
const APOLLO_IMPORTS = [
  "import { ApolloError } from '@apollo/client';",
  "import { MockedResponse } from '@apollo/client/testing';",
];
const MOCK_FN_INTERFACE = `
  interface MockFn<Input, Query> {
    ({
      input,
      result,
      error,
    }: {
      input?: Input;
      result?: Query;
      error?: ApolloError;
    }): MockedResponse<Query>;
  }  
  `;
function hasListType(typeNode) {
  if (typeNode.kind === 'ListType') {
    return true;
  }
  if (typeNode.kind === 'NamedType') {
    return false;
  }
  return hasListType(typeNode.type);
}
function buildQueryResult(transformedSelections, config, types = new Set()) {
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
  return [ret, [...types]];
}
function mockFnTemplate({
  functionName,
  queryVarsType,
  queryResultType,
  documentNode,
  queryResult,
  queryResultVar,
  mocks,
}) {
  return `
  export const ${functionName}: MockFn<
  ${queryVarsType},
  ${queryResultType}
> = ({ result, input, error }) => {
  ${mocks}

  ${queryResult}

  return {
    request: {
      query: ${documentNode},
      variables: { input },
    },
    result: {
      data: result != null ? result : ${queryResultVar},
      error,
    },
  };
};
  `;
}
function mockFnName(type, prefix) {
  if (prefix) {
    return `${prefix}${type}`;
  }
  return (0, indefinite_1.default)(type, { articleOnly: true }) + type;
}
function mockInstanceName(type) {
  return type[0].toLowerCase() + type.substring(1) + 'Mock';
}
function handleOperationResult(operation, config) {
  const functionName = `mock${operation.name?.value}`;
  const queryResultType = `${operation.name?.value}Query`;
  const queryVarsType = `${operation.name?.value}QueryVariables`;
  const documentNode = `${operation.name?.value}Document`;
  const transformedFields = operation.selectionSet.selections ?? [];
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
function getConfig(config) {
  const baseConfig = {
    typesFile: './types.ts',
    addTypename: false,
  };
  const resolved = Object.assign(baseConfig, config);
  // drop extension
  resolved.typesFile = resolved.typesFile.replace(/\.[\w]+$/, '');
  return resolved;
}
exports.getConfig = getConfig;
const plugin = (schema, documents, config) => {
  const docsAST = (0, graphql_1.concatAST)(documents.map((v) => v.document));
  const typeInfo = new graphql_1.TypeInfo(schema);
  const result = (0, graphql_1.visit)(
    docsAST,
    (0, graphql_1.visitWithTypeInfo)(typeInfo, {
      Field: {
        leave(node) {
          const parentType = typeInfo.getParentType();
          const type = typeInfo.getType();
          const transformed = {
            parentType,
            type,
            fieldName: node.name.value,
            selections: node.selectionSet?.selections,
            kind: hasListType(typeInfo.getFieldDef().astNode.type)
              ? 'connection'
              : 'primitive',
          };
          return transformed;
        },
      },
    })
  );
  const resolvedConfig = getConfig(config);
  function isOperationDefinitionPredicate(node, index, array) {
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
  const lines = [MOCK_FN_INTERFACE];
  return {
    prepend: imports,
    content: lines
      .concat(
        templateVars.map(({ templateVars }) => mockFnTemplate(templateVars))
      )
      .join('\n'),
  };
};
exports.plugin = plugin;
