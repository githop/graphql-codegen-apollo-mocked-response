import { ApolloError } from '@apollo/client';
import { MockedResponse } from '@apollo/client/testing';
import { ListPlanetsDocument, ListPlanetsQuery, ListPlanetsQueryVariables } from './types'
import { ListPlanetsInput, Location, Mutation, Orbit, Planet, PlanetInput, Query, PlanetType } from './types';

export const aListPlanetsInput = (overrides?: Partial<ListPlanetsInput>): ListPlanetsInput => {
    return {
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : PlanetType.Gaseous,
    };
};

export const aLocation = (overrides?: Partial<Location>): { __typename: 'Location' } & Location => {
    return {
        __typename: 'Location',
        coordinates: overrides && overrides.hasOwnProperty('coordinates') ? overrides.coordinates! : 'velit',
        description: overrides && overrides.hasOwnProperty('description') ? overrides.description! : 'officiis',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'bfe52c08-bd42-41df-a3d4-364c80b41fe8',
    };
};

export const aMutation = (overrides?: Partial<Mutation>): { __typename: 'Mutation' } & Mutation => {
    return {
        __typename: 'Mutation',
        createPlanet: overrides && overrides.hasOwnProperty('createPlanet') ? overrides.createPlanet! : true,
    };
};

export const anOrbit = (overrides?: Partial<Orbit>): { __typename: 'Orbit' } & Orbit => {
    return {
        __typename: 'Orbit',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'cb6d9b13-cc5b-4d03-ab32-b7e56988c4e1',
        location: overrides && overrides.hasOwnProperty('location') ? overrides.location! : aLocation(),
    };
};

export const aPlanet = (overrides?: Partial<Planet>): { __typename: 'Planet' } & Planet => {
    return {
        __typename: 'Planet',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'b2ee0cbb-1ba9-43e2-8dab-9e265b803ede',
        location: overrides && overrides.hasOwnProperty('location') ? overrides.location! : aLocation(),
        mass: overrides && overrides.hasOwnProperty('mass') ? overrides.mass! : 1348,
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'vero',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : PlanetType.Gaseous,
    };
};

export const aPlanetInput = (overrides?: Partial<PlanetInput>): PlanetInput => {
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'd984b4e2-23e4-4f39-8673-6db83544c479',
    };
};

export const aQuery = (overrides?: Partial<Query>): { __typename: 'Query' } & Query => {
    return {
        __typename: 'Query',
        getPlanet: overrides && overrides.hasOwnProperty('getPlanet') ? overrides.getPlanet! : aPlanet(),
        listLocations: overrides && overrides.hasOwnProperty('listLocations') ? overrides.listLocations! : [aLocation()],
        listPlanets: overrides && overrides.hasOwnProperty('listPlanets') ? overrides.listPlanets! : [aPlanet()],
    };
};


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
  

  export const mockListPlanets: MockFn<
  ListPlanetsQueryVariables,
  ListPlanetsQuery
> = ({ result, input, error }) => {
  const planetMock = aPlanet();
const locationMock = aLocation();

  const ListPlanetsResult: ListPlanetsQuery = { __typename: 'Query', listPlanets: [{ __typename: 'Planet', id: planetMock.id, name: planetMock.name, location: {  __typename: 'Location', id: locationMock.id, coordinates: locationMock.coordinates, }, }], }

  return {
    request: {
      query: ListPlanetsDocument,
      variables: { input },
    },
    result: {
      data: result != null ? result : ListPlanetsResult,
      error,
    },
  };
};
  