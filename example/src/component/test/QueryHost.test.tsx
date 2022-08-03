/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { QueryHost } from '../QueryHost';
import { render } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react/MockedProvider';
import { mockListPlanets } from '../../generated/mocks';

describe('QueryHost', () => {
  const Component = (mocks?: any[]) => {
    return render(
      <MockedProvider mocks={mocks || []}>
        <QueryHost />
      </MockedProvider>
    );
  };

  it('does things', async () => {
    const mocks = mockListPlanets({
      variables: { input: { type: 'Gaseous' } },
      result: {
        listPlanets: [
          {
            id: '123',
            type: 'Gaseous',
            mass: 1348,
            name: 'foo',
            location: {
              id: '456',
              coordinates: 'here',
            },
          },
        ],
      },
    });

    const { findByText } = Component([mocks]);

    expect(await findByText('1348'));
  });
});
