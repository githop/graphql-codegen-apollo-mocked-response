import React from 'react';
import { useCreatePlanetMutation } from '../generated/types';

export function MutationHost() {
  const [mutation, { data }] = useCreatePlanetMutation();

  return (
    <div>
      <h1>Create a planet</h1>

      {data != null && data.createPlanet && (
        <div>
          <p>id:</p>
          <p>{data.createPlanet.id}</p>
          <p>name</p>
          <p>{data.createPlanet.name}</p>
          <p>location:</p>
          <p>{data.createPlanet.location.coordinates}</p>
        </div>
      )}

      <button
        data-testid="create-planet-btn"
        onClick={() => {
          mutation({ variables: { input: { id: '123' } } });
        }}
      >
        create
      </button>
    </div>
  );
}
