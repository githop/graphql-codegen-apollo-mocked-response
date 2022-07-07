import React from 'react';
import { useListPlanetsQuery } from '../generated/types';

export function QueryHost() {
  const request = useListPlanetsQuery({
    variables: { input: { type: 'Gaseous' } },
  });

  const { data } = request;

  if (data == null) {
    return null;
  }

  return (
    <div>
      <p>hello</p>
      {data.listPlanets.map((planetFields) => {
        return (
          <div key={planetFields.id}>
            <p>{planetFields.name}</p>
            <p>{planetFields.location.coordinates}</p>
          </div>
        );
      })}
    </div>
  );
}
