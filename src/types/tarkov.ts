export interface Trader {
  id: string | number;
  name: string;
  imageLink?: string;
  avatarUrl?: string;
}

export interface MapInfo {
  id: string;
  name: string;
  normalizedName: string;
  wiki?: string;
  image?: string;
  rotation?: number;
}

export interface ObjectiveGPS {
  leftPercent: number;
  topPercent: number;
  floor?: string;
}

export interface ObjectivePosition {
  x: number;
  y: number;
  z: number;
}

export interface ObjectiveZone {
  id: string;
  map?: {
    id: string;
    name: string;
  };
  position?: ObjectivePosition;
}

export interface Objective {
  id: string | number;
  type: string;
  description?: string;
  target?: string | string[];
  number?: number;
  location?: number | string;
  gps?: ObjectiveGPS;
  zones?: ObjectiveZone[];
  hint?: string;
  optional?: boolean;
  tool?: string;
  with?: string[];
}

export interface Quest {
  id: string | number;
  gameId?: string;
  title: string;
  locales?: {
    en?: string;
    ko?: string;
    ru?: string;
  };
  wiki?: string;
  giver: Trader;
  turnin?: Trader;
  minPlayerLevel: number;
  map?: MapInfo;
  objectives: Objective[];
  exp?: number;
  unlocks?: string[];
  reputation?: { trader: string; rep: number }[];
}

export interface MapCoordinateConfig {
  name: string;
  x: string;
  z: string;
  rotation: number;
  bounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

export interface MapMarker {
  id: string;
  questId: string | number;
  questTitle: string;
  traderName: string;
  objectiveId: string | number;
  objectiveType: string;
  objectiveText: string;
  mapId: string;
  xPercent: number;
  yPercent: number;
  floor?: string;
  optional?: boolean;
}
