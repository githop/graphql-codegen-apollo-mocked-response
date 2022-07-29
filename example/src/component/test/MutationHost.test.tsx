/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { MutationHost } from '../MutationHost';
import { render, fireEvent, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react/MockedProvider';
import { mockCreatePlanet } from '../../generated/mocks';

describe('MutationHost', () => {
  const Component = (mocks?: any[]) => {
    return render(
      <MockedProvider mocks={mocks || []}>
        <MutationHost />
      </MockedProvider>
    );
  };

  it('can create a planet', async () => {
    Component([
      mockCreatePlanet({
        variables: {
          input: { id: '123' },
        },
        result: {
          createPlanet: {
            id: '123',
            name: 'Planet awesome',
            location: { id: '456', coordinates: 'where you want to be' },
          },
        },
      }),
    ]);

    const btn = await screen.findByTestId('create-planet-btn');

    fireEvent.click(btn);

    expect(await screen.findByText('123'));
    expect(screen.getByText('Planet awesome'));
    expect(screen.getByText('where you want to be'));
  });
});
