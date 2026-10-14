import { oconnellBuilding } from './oconnell';
import type { Building } from './types';

export const buildings: Record<string, Building> = 
{
	[oconnellBuilding.id]: oconnellBuilding,
};
