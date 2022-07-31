import {
  TypeInfo,
  visitWithTypeInfo,
  visit,
  DocumentNode,
  GraphQLSchema,
  FragmentSpreadNode,
  TypeNode,
  FragmentDefinitionNode,
  Kind,
  SelectionSetNode,
  OperationDefinitionNode,
} from 'graphql';

export interface TransformedField {
  parentTypename: string;
  fieldName: string;
  // primitive are scalars and connections are just embedded objects
  kind: 'primitive' | 'connection';
  selections?: TransformedSelections;
}

export type TransformedSelections = Array<
  TransformedField | TransformedFragmentSpread
>;

export interface TransformedFragmentSpread {
  name: string;
  kind: FragmentSpreadNode['kind'];
}

export interface TransformedFragment {
  name: string;
  kind: FragmentDefinitionNode['kind'];
  type: string;
  selections: TransformedSelections;
}

export interface TransformedSelectionSet {
  kind: SelectionSetNode['kind'];
  selections: TransformedSelections;
}

export interface TransformedOperation {
  kind: OperationDefinitionNode['kind'];
  operation: OperationDefinitionNode['operation'];
  selectionSet: TransformedSelectionSet;
  name: string;
}

export function isTransformedField(node: any): node is TransformedField {
  return (
    ('kind' in node && node.kind === 'primitive') || node.kind === 'connection'
  );
}

export function isTransformedFragment(node: any): node is TransformedFragment {
  return (
    'kind' in node &&
    node.kind === Kind.FRAGMENT_DEFINITION &&
    'selections' in node
  );
}

export function isTransformedOperation(
  node: any
): node is TransformedOperation {
  return (
    'kind' in node &&
    node.kind === Kind.OPERATION_DEFINITION &&
    'name' in node &&
    typeof node.name === 'string'
  );
}

export function hasListType(typeNode: TypeNode): boolean {
  if (typeNode.kind === 'ListType') {
    return true;
  }

  if (typeNode.kind === 'NamedType') {
    return false;
  }
  return hasListType(typeNode.type);
}

export function visitor(ast: DocumentNode, schema: GraphQLSchema) {
  const typeInfo = new TypeInfo(schema);

  return visit(
    ast,
    visitWithTypeInfo(typeInfo, {
      FragmentSpread: {
        leave(node) {
          const transformedFragmentSpread: TransformedFragmentSpread = {
            kind: node.kind,
            name: node.name as any,
          };
          return transformedFragmentSpread;
        },
      },
      FragmentDefinition: {
        leave(node) {
          const transformedFragment: TransformedFragment = {
            name: node.name as any,
            kind: node.kind,
            type: node.typeCondition.name as any,
            selections: node.selectionSet.selections as any,
          };
          return transformedFragment;
        },
      },
      OperationDefinition: {
        leave(node) {
          const transformedOperation: TransformedOperation = {
            kind: node.kind,
            operation: node.operation,
            name: node.name as any,
            selectionSet: node.selectionSet as any,
          };
          return transformedOperation;
        },
      },
      SelectionSet: {
        leave(node) {
          const transformedSelectionSet: TransformedSelectionSet = {
            kind: node.kind,
            selections: node.selections as any,
          };
          return transformedSelectionSet;
        },
      },
      Field: {
        leave(node) {
          const parentTypename = typeInfo.getParentType()!.name;
          const transformed: TransformedField = {
            parentTypename,
            fieldName: node.name as any,
            kind: hasListType(typeInfo.getFieldDef()!.astNode!.type)
              ? 'connection'
              : 'primitive',
            selections: node.selectionSet?.selections as any[],
          };
          return transformed;
        },
      },
      Name: {
        leave(node) {
          return node.value;
        },
      },
    })
  );
}
