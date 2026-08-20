import type { ObjectivePosition, MapMarker, Quest } from '../types/tarkov';

// Map Coordinate Configurations & Rotations based on map_coordinates.json
export const MAP_CONFIGS: Record<string, { id: string; name: string; rotation: number; bounds: { minX: number; maxX: number; minZ: number; maxZ: number } }> = {
  customs: {
    id: 'customs',
    name: 'Customs',
    rotation: 180,
    bounds: { minX: -400, maxX: 500, minZ: -300, maxZ: 400 },
  },
  factory: {
    id: 'factory',
    name: 'Factory',
    rotation: 90,
    bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
  },
  interchange: {
    id: 'interchange',
    name: 'Interchange',
    rotation: 180,
    bounds: { minX: -500, maxX: 500, minZ: -500, maxZ: 500 },
  },
  labs: {
    id: 'labs',
    name: 'Labs',
    rotation: 270,
    bounds: { minX: -200, maxX: 200, minZ: -200, maxZ: 200 },
  },
  lighthouse: {
    id: 'lighthouse',
    name: 'Lighthouse',
    rotation: 180,
    bounds: { minX: -600, maxX: 600, minZ: -800, maxZ: 800 },
  },
  reserve: {
    id: 'reserve',
    name: 'Reserve',
    rotation: 195.209,
    bounds: { minX: -400, maxX: 400, minZ: -400, maxZ: 400 },
  },
  shoreline: {
    id: 'shoreline',
    name: 'Shoreline',
    rotation: 180,
    bounds: { minX: -900, maxX: 900, minZ: -700, maxZ: 700 },
  },
  streets: {
    id: 'streets',
    name: 'Streets of Tarkov',
    rotation: 180,
    bounds: { minX: -600, maxX: 600, minZ: -600, maxZ: 600 },
  },
  woods: {
    id: 'woods',
    name: 'Woods',
    rotation: 180,
    bounds: { minX: -800, maxX: 800, minZ: -800, maxZ: 800 },
  },
};

/**
 * Rotate a 3D point (x, y, z) using rotation angle theta in degrees
 */
export function rotate3DPoint(
  position: ObjectivePosition,
  rotationDeg: number,
  centerX = 0,
  centerY = 0
): { x: number; z: number } {
  const angleRadians = (rotationDeg * -1 * Math.PI) / 180;
  const translatedX = position.x - centerX;
  const translatedZ = position.z - centerY;

  const rotatedX = translatedX * Math.cos(angleRadians) - translatedZ * Math.sin(angleRadians);
  const rotatedZ = translatedX * Math.sin(angleRadians) + translatedZ * Math.cos(angleRadians);

  return {
    x: rotatedX + centerX,
    z: rotatedZ + centerY,
  };
}

/**
 * Map 3D position to 2D percentage coordinates on map image (0% - 100%)
 */
export function position3DToPercent(
  position: ObjectivePosition,
  mapId: string
): { leftPercent: number; topPercent: number } {
  const mapConfig = MAP_CONFIGS[mapId.toLowerCase()] || MAP_CONFIGS.customs;
  const rotated = rotate3DPoint(position, mapConfig.rotation);

  const { minX, maxX, minZ, maxZ } = mapConfig.bounds;
  const leftPercent = Math.max(0, Math.min(100, ((rotated.x - minX) / (maxX - minX)) * 100));
  const topPercent = Math.max(0, Math.min(100, ((rotated.z - minZ) / (maxZ - minZ)) * 100));

  return {
    leftPercent: Number(leftPercent.toFixed(2)),
    topPercent: Number(topPercent.toFixed(2)),
  };
}

/**
 * Extract markers for a given map from accepted/active quests
 */
export function extractQuestMarkersForMap(
  quests: Quest[],
  acceptedQuestIds: Set<string | number>,
  targetMapId: string
): MapMarker[] {
  const markers: MapMarker[] = [];
  const normalizedTargetMap = targetMapId.toLowerCase().replace(/[^a-z0-9]/g, '');

  quests.forEach((quest) => {
    if (!acceptedQuestIds.has(quest.id) && !acceptedQuestIds.has(String(quest.id))) {
      return;
    }

    quest.objectives.forEach((obj) => {
      let matched = false;

      // 1. Direct GPS % coordinates (DB contains raw normalized % for standard maps)
      if (obj.gps && obj.gps.leftPercent !== undefined && obj.gps.topPercent !== undefined) {
        markers.push({
          id: `marker-${quest.id}-${obj.id}`,
          questId: quest.id,
          questTitle: quest.title,
          traderName: typeof quest.giver === 'object' ? quest.giver.name : String(quest.giver),
          objectiveId: obj.id,
          objectiveType: obj.type || 'objective',
          objectiveText: obj.description || obj.target ? `${obj.type}: ${Array.isArray(obj.target) ? obj.target.join(', ') : obj.target}` : 'Task Objective',
          mapId: targetMapId,
          xPercent: obj.gps.leftPercent,
          yPercent: obj.gps.topPercent,
          floor: obj.gps.floor,
          optional: obj.optional,
        });
        matched = true;
      }

      // 2. 3D Vector3 Zone coordinates
      if (!matched && obj.zones && obj.zones.length > 0) {
        obj.zones.forEach((zone, zoneIdx) => {
          if (zone.position) {
            const zoneMapName = zone.map?.name ? zone.map.name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
            if (!zoneMapName || zoneMapName.includes(normalizedTargetMap) || normalizedTargetMap.includes(zoneMapName)) {
              const coords = position3DToPercent(zone.position, targetMapId);
              markers.push({
                id: `marker-${quest.id}-${obj.id}-${zoneIdx}`,
                questId: quest.id,
                questTitle: quest.title,
                traderName: typeof quest.giver === 'object' ? quest.giver.name : String(quest.giver),
                objectiveId: obj.id,
                objectiveType: obj.type || 'zone',
                objectiveText: obj.description || `Zone Objective (${zone.position.x.toFixed(1)}, ${zone.position.z.toFixed(1)})`,
                mapId: targetMapId,
                xPercent: coords.leftPercent,
                yPercent: coords.topPercent,
                optional: obj.optional,
              });
            }
          }
        });
      }
    });
  });

  return markers;
}
