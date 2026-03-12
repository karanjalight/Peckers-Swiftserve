export type ManagerKpis = {
  totalVisits: number;
  stockOuts: number;
  substitutionRate: number;
  totalProductAudits: number;
  competitorCount: number;
  uniquePharmacies: number;
};

export type MrKpis = {
  totalVisits: number;
  uniquePharmacies: number;
};

export type ManagerChartData = {
  byRegion: { name: string; value: number }[];
  byObjective: { name: string; value: number }[];
  byPharmacy: { name: string; value: number }[];
  byMonth: { name: string; visits: number }[];
  byProduct: { name: string; value: number }[];
};

export type MrChartData = {
  byMonth: { name: string; visits: number }[];
  byObjective: { name: string; value: number }[];
  byPharmacy: { name: string; value: number }[];
};

export type RecentVisit = {
  id: string;
  checkIn: string;
  pharmacy: string;
  region?: string;
  objective?: string;
  canEdit?: boolean;
};

