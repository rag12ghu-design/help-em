export type ResourceCategory = 'power' | 'shelter' | 'water' | 'medical' | 'transport';

export interface AidStation {
  id: number;
  category: ResourceCategory;
  title: string;
  location: string;
  details: string;
  status: string;
  capacity: string;
  coordinator: string;
  badgeColor?: string;
}
