import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { buildings } from '../../src/buildings/registry';
import FloorPlanViewer from '../../src/components/FloorPlanViewer';

afterEach(cleanup);

describe('plain building maps', () => {
  for (const building of Object.values(buildings)) {
    it(`shows ${building.name} without an embedded document dashboard`, () => {
      const { container } = render(
        <FloorPlanViewer building={building} routeNodes={[]} />
      );
      expect(
        screen.getByRole('img', { name: `${building.name}, floor 1` })
      ).toBeTruthy();
      expect(container.querySelector('object, iframe, embed')).toBeNull();
    });
  }
});
