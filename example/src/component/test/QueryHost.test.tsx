/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { QueryHost } from '../QueryHost';
import { render } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react/MockedProvider';
import { mockListPlanets } from '../../generated/mocks';
import { ListPlanetsDocument } from '../../generated/types';

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
      input: { input: { type: 'Gaseous' } },
    });

    const { findByText } = Component([mocks]);

    expect(await findByText('Hello World'));
  });
});
