import { oconnellBuilding } from './oconnell';
import type { Building } from './types';
//This is where all of the buildings will go, in this format. An entry will have to be made for each building. 
export const buildings: Record<string, Building> = 
{
	[oconnellBuilding.id]: oconnellBuilding,
};
