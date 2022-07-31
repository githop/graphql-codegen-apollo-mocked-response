import { ApolloError } from '@apollo/client';
import { MockedResponse } from '@apollo/client/testing';
import {
  ListPlanetsDocument,
  ListPlanetsQuery,
  ListPlanetsQueryVariables,
} from './types';
import {
  ListPlanetsInput,
  Location,
  Mutation,
  Orbit,
  Planet,
  PlanetInput,
  Query,
  PlanetType,
} from './types';

export const aListPlanetsInput = (
  overrides?: Partial<ListPlanetsInput>
): ListPlanetsInput => {
  return {
    type:
      overrides && overrides.hasOwnProperty('type')
        ? overrides.type!
        : PlanetType.Gaseous,
  };
};

export const aLocation = (overrides?: Partial<Location>): Location => {
  return {
    coordinates:
      overrides && overrides.hasOwnProperty('coordinates')
        ? overrides.coordinates!
        : 'velit',
    description:
      overrides && overrides.hasOwnProperty('description')
        ? overrides.description!
        : 'officiis',
    id:
      overrides && overrides.hasOwnProperty('id')
        ? overrides.id!
        : 'bfe52c08-bd42-41df-a3d4-364c80b41fe8',
  };
};

export const aMutation = (overrides?: Partial<Mutation>): Mutation => {
  return {
    createPlanet:
      overrides && overrides.hasOwnProperty('createPlanet')
        ? overrides.createPlanet!
        : true,
  };
};

export const anOrbit = (overrides?: Partial<Orbit>): Orbit => {
  return {
    id:
      overrides && overrides.hasOwnProperty('id')
        ? overrides.id!
        : 'cb6d9b13-cc5b-4d03-ab32-b7e56988c4e1',
    location:
      overrides && overrides.hasOwnProperty('location')
        ? overrides.location!
        : aLocation(),
  };
};

export const aPlanet = (overrides?: Partial<Planet>): Planet => {
  return {
    id:
      overrides && overrides.hasOwnProperty('id')
        ? overrides.id!
        : 'b2ee0cbb-1ba9-43e2-8dab-9e265b803ede',
    location:
      overrides && overrides.hasOwnProperty('location')
        ? overrides.location!
        : aLocation(),
    mass:
      overrides && overrides.hasOwnProperty('mass') ? overrides.mass! : 1348,
    name:
      overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'vero',
    type:
      overrides && overrides.hasOwnProperty('type')
        ? overrides.type!
        : PlanetType.Gaseous,
  };
};

export const aPlanetInput = (overrides?: Partial<PlanetInput>): PlanetInput => {
  return {
    id:
      overrides && overrides.hasOwnProperty('id')
        ? overrides.id!
        : 'd984b4e2-23e4-4f39-8673-6db83544c479',
  };
};

export const aQuery = (overrides?: Partial<Query>): Query => {
  return {
    getPlanet:
      overrides && overrides.hasOwnProperty('getPlanet')
        ? overrides.getPlanet!
        : aPlanet(),
    listLocations:
      overrides && overrides.hasOwnProperty('listLocations')
        ? overrides.listLocations!
        : [aLocation()],
    listPlanets:
      overrides && overrides.hasOwnProperty('listPlanets')
        ? overrides.listPlanets!
        : [aPlanet()],
  };
};

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

export const mockListPlanets: MockFn<
  ListPlanetsQueryVariables,
  ListPlanetsQuery
> = ({ result, variables, error }) => {
  const planetMock = aPlanet();
  const locationMock = aLocation();

  const ListPlanetsResult: ListPlanetsQuery = {
    listPlanets: [
      {
        id: planetMock.id,
        type: planetMock.type,
        mass: planetMock.mass,
        name: planetMock.name,
        location: {
          id: locationMock.id,
          coordinates: locationMock.coordinates,
        },
      },
    ],
  };

  return {
    request: {
      query: ListPlanetsDocument,
      variables,
    },
    result: {
      data: result != null ? result : ListPlanetsResult,
      error,
    },
  };
};
