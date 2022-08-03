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

interface BaseField {
  parentTypename: string;
  fieldName: string;
  // primitive are scalars and connections are just embedded objects
  kind: 'primitive' | 'connection';
}

export type VisitedSelections = Array<VisitedField | VisitedFragmentSpread>;

export interface VisitedField extends BaseField {
  selections?: VisitedSelections;
}

export interface VisitedFragmentSpread {
  name: string;
  kind: FragmentSpreadNode['kind'];
}

export interface VisitedFragment {
  name: string;
  kind: FragmentDefinitionNode['kind'];
  selections: VisitedSelections;
}

export interface VisitedSelectionSet {
  kind: SelectionSetNode['kind'];
  selections: VisitedSelections;
}

export interface VisitedOperation {
  kind: OperationDefinitionNode['kind'];
  operation: OperationDefinitionNode['operation'];
  selectionSet: VisitedSelectionSet;
  name: string;
}

export interface InlinedFragmentField {
  kind: 'FragmentSpread';
  name: 'string';
  selections: Array<VisitedField>;
}

export type InlinedSelections = Array<VisitedField | InlinedFragmentField>;

export interface InlinedField extends BaseField {
  selections: InlinedSelections;
}

export interface InlinedSelectionSet {
  kind: SelectionSetNode['kind'];
  selections: InlinedSelections;
}

export interface TargetField extends BaseField {
  selections?: TargetField[];
}

export interface TargetSelectionSet {
  kind: SelectionSetNode['kind'];
  selections: TargetField[];
}

export function isTransformedField(node: any): node is VisitedField {
  return 'parentTypename' in node && 'fieldName' in node && 'kind' in node;
}

export function isTransformedFragment(node: any): node is VisitedFragment {
  return (
    'kind' in node &&
    node.kind === Kind.FRAGMENT_DEFINITION &&
    'selections' in node
  );
}

export function isTransformedOperation(node: any): node is VisitedOperation {
  return (
    'kind' in node &&
    node.kind === Kind.OPERATION_DEFINITION &&
    'name' in node &&
    typeof node.name === 'string'
  );
}

export function createSelectionSet(): VisitedSelectionSet {
  return { kind: Kind.SELECTION_SET, selections: [] };
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
          const transformedFragmentSpread: VisitedFragmentSpread = {
            kind: node.kind,
            name: node.name as any,
          };
          return transformedFragmentSpread;
        },
      },
      FragmentDefinition: {
        leave(node) {
          const transformedFragment: VisitedFragment = {
            name: node.name as any,
            kind: node.kind,
            selections: node.selectionSet.selections as any,
          };
          return transformedFragment;
        },
      },
      OperationDefinition: {
        leave(node) {
          const transformedOperation: VisitedOperation = {
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
          const transformedSelectionSet: VisitedSelectionSet = {
            kind: node.kind,
            selections: node.selections as any,
          };
          return transformedSelectionSet;
        },
      },
      Field: {
        leave(node) {
          const parentTypename = typeInfo.getParentType()!.name;
          const transformed: VisitedField = {
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
