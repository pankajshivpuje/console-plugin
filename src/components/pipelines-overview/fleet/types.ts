import type { SpokeName } from '../../__demo__/mock-fleet-data';

export interface FleetFilterState {
  selectedSpokes: SpokeName[];
  timeRange: string;
  search: string;
}
