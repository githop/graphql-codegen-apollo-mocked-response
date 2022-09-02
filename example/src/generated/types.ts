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

export type list_planets_input = {
  type?: InputMaybe<planet_type>;
};

export type location = {
  __typename?: 'Location';
  coordinates: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
};

export type mutation = {
  __typename?: 'Mutation';
  createPlanet?: Maybe<planet>;
};

export type mutationcreate_planet_args = {
  input?: InputMaybe<planet_input>;
};

export type orbit = {
  __typename?: 'Orbit';
  id: Scalars['ID'];
  location: location;
};

export type planet = {
  __typename?: 'Planet';
  id: Scalars['ID'];
  location: location;
  mass?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  type?: Maybe<planet_type>;
};

export type planet_input = {
  id: Scalars['ID'];
};

export const planet_type = {
  gaseous: 'Gaseous',
  terrestrial: 'Terrestrial',
} as const;

export type planet_type = typeof planet_type[keyof typeof planet_type];
export type query = {
  __typename?: 'Query';
  getPlanet?: Maybe<planet>;
  listLocations: Array<location>;
  listPlanets: Array<planet>;
};

export type queryget_planet_args = {
  input: planet_input;
};

export type querylist_planets_args = {
  input: list_planets_input;
};

export type list_planets_query_variables = Exact<{
  input: list_planets_input;
}>;

export type list_planets_query = {
  __typename?: 'Query';
  listPlanets: Array<{
    __typename?: 'Planet';
    mass?: number | null;
    id: string;
    type?: planet_type | null;
    name?: string | null;
    location: { __typename?: 'Location'; id: string; coordinates: string };
  }>;
};

export type location_fields_fragment = {
  __typename?: 'Location';
  id: string;
  coordinates: string;
};

export type planet_base_fragment = {
  __typename?: 'Planet';
  id: string;
  type?: planet_type | null;
};

export type planet_fields_fragment = {
  __typename?: 'Planet';
  name?: string | null;
  location: { __typename?: 'Location'; id: string; coordinates: string };
};

export type create_planet_mutation_variables = Exact<{
  input: planet_input;
}>;

export type create_planet_mutation = {
  __typename?: 'Mutation';
  createPlanet?: {
    __typename?: 'Planet';
    id: string;
    name?: string | null;
    location: { __typename?: 'Location'; id: string; coordinates: string };
  } | null;
};

export const planet_base_fragment_doc = gql`
  fragment PlanetBase on Planet {
    id
    type
  }
`;
export const location_fields_fragment_doc = gql`
  fragment LocationFields on Location {
    id
    coordinates
  }
`;
export const planet_fields_fragment_doc = gql`
  fragment PlanetFields on Planet {
    name
    location {
      ...LocationFields
    }
  }
  ${location_fields_fragment_doc}
`;
export const list_planets_document = gql`
  query ListPlanets($input: ListPlanetsInput!) {
    listPlanets(input: $input) {
      ...PlanetBase
      mass
      ...PlanetFields
    }
  }
  ${planet_base_fragment_doc}
  ${planet_fields_fragment_doc}
`;

/**
 * __uselist_planets_query__
 *
 * To run a query within a React component, call `uselist_planets_query` and pass it any options that fit your needs.
 * When your component renders, `uselist_planets_query` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = uselist_planets_query({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function uselist_planets_query(
  baseOptions: Apollo.QueryHookOptions<
    list_planets_query,
    list_planets_query_variables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<list_planets_query, list_planets_query_variables>(
    list_planets_document,
    options
  );
}
export function uselist_planets_lazy_query(
  baseOptions?: Apollo.LazyQueryHookOptions<
    list_planets_query,
    list_planets_query_variables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<list_planets_query, list_planets_query_variables>(
    list_planets_document,
    options
  );
}
export type list_planets_queryHookResult = ReturnType<
  typeof uselist_planets_query
>;
export type list_planets_lazy_queryHookResult = ReturnType<
  typeof uselist_planets_lazy_query
>;
export type list_planets_query_result = Apollo.QueryResult<
  list_planets_query,
  list_planets_query_variables
>;
export const create_planet_document = gql`
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
export type create_planet_mutation_fn = Apollo.MutationFunction<
  create_planet_mutation,
  create_planet_mutation_variables
>;

/**
 * __usecreate_planet_mutation__
 *
 * To run a mutation, you first call `usecreate_planet_mutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usecreate_planet_mutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPlanetMutation, { data, loading, error }] = usecreate_planet_mutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usecreate_planet_mutation(
  baseOptions?: Apollo.MutationHookOptions<
    create_planet_mutation,
    create_planet_mutation_variables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    create_planet_mutation,
    create_planet_mutation_variables
  >(create_planet_document, options);
}
export type create_planet_mutationHookResult = ReturnType<
  typeof usecreate_planet_mutation
>;
export type create_planet_mutation_result =
  Apollo.MutationResult<create_planet_mutation>;
export type create_planet_mutation_options = Apollo.BaseMutationOptions<
  create_planet_mutation,
  create_planet_mutation_variables
>;
