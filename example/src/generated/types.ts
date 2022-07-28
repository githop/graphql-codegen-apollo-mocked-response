import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type ListPlanetsInput = {
  type?: InputMaybe<PlanetType>;
};

export type Location = {
  __typename?: 'Location';
  coordinates: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createPlanet?: Maybe<Planet>;
};

export type MutationCreatePlanetArgs = {
  input?: InputMaybe<PlanetInput>;
};

export type Orbit = {
  __typename?: 'Orbit';
  id: Scalars['ID'];
  location: Location;
};

export type Planet = {
  __typename?: 'Planet';
  id: Scalars['ID'];
  location: Location;
  mass?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  type?: Maybe<PlanetType>;
};

export type PlanetInput = {
  id: Scalars['ID'];
};

export const PlanetType = {
  Gaseous: 'Gaseous',
  Terrestrial: 'Terrestrial',
} as const;

export type PlanetType = typeof PlanetType[keyof typeof PlanetType];
export type Query = {
  __typename?: 'Query';
  getPlanet?: Maybe<Planet>;
  listLocations: Array<Location>;
  listPlanets: Array<Planet>;
};

export type QueryGetPlanetArgs = {
  input: PlanetInput;
};

export type QueryListPlanetsArgs = {
  input: ListPlanetsInput;
};

export type ListPlanetsQueryVariables = Exact<{
  input: ListPlanetsInput;
}>;

export type ListPlanetsQuery = {
  __typename?: 'Query';
  listPlanets: Array<{
    __typename?: 'Planet';
    id: string;
    name?: string | null;
    location: { __typename?: 'Location'; id: string; coordinates: string };
  }>;
};

export type CreatePlanetMutationVariables = Exact<{
  input: PlanetInput;
}>;

export type CreatePlanetMutation = {
  __typename?: 'Mutation';
  createPlanet?: {
    __typename?: 'Planet';
    id: string;
    name?: string | null;
    location: { __typename?: 'Location'; id: string; coordinates: string };
  } | null;
};

export const ListPlanetsDocument = gql`
  query ListPlanets($input: ListPlanetsInput!) {
    listPlanets(input: $input) {
      id
      name
      location {
        id
        coordinates
      }
    }
  }
`;

/**
 * __useListPlanetsQuery__
 *
 * To run a query within a React component, call `useListPlanetsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListPlanetsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListPlanetsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useListPlanetsQuery(
  baseOptions: Apollo.QueryHookOptions<
    ListPlanetsQuery,
    ListPlanetsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ListPlanetsQuery, ListPlanetsQueryVariables>(
    ListPlanetsDocument,
    options
  );
}
export function useListPlanetsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ListPlanetsQuery,
    ListPlanetsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ListPlanetsQuery, ListPlanetsQueryVariables>(
    ListPlanetsDocument,
    options
  );
}
export type ListPlanetsQueryHookResult = ReturnType<typeof useListPlanetsQuery>;
export type ListPlanetsLazyQueryHookResult = ReturnType<
  typeof useListPlanetsLazyQuery
>;
export type ListPlanetsQueryResult = Apollo.QueryResult<
  ListPlanetsQuery,
  ListPlanetsQueryVariables
>;
export const CreatePlanetDocument = gql`
  mutation CreatePlanet($input: PlanetInput!) {
    createPlanet(input: $input) {
      id
      name
      location {
        id
        coordinates
      }
    }
  }
`;
export type CreatePlanetMutationFn = Apollo.MutationFunction<
  CreatePlanetMutation,
  CreatePlanetMutationVariables
>;

/**
 * __useCreatePlanetMutation__
 *
 * To run a mutation, you first call `useCreatePlanetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePlanetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPlanetMutation, { data, loading, error }] = useCreatePlanetMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePlanetMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreatePlanetMutation,
    CreatePlanetMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreatePlanetMutation,
    CreatePlanetMutationVariables
  >(CreatePlanetDocument, options);
}
export type CreatePlanetMutationHookResult = ReturnType<
  typeof useCreatePlanetMutation
>;
export type CreatePlanetMutationResult =
  Apollo.MutationResult<CreatePlanetMutation>;
export type CreatePlanetMutationOptions = Apollo.BaseMutationOptions<
  CreatePlanetMutation,
  CreatePlanetMutationVariables
>;
