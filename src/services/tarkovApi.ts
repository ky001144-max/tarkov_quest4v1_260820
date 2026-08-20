import type { Quest, Trader, MapInfo } from '../types/tarkov';
import { loadItemData, resolveItemName } from '../utils/itemResolver';

export const TRADERS: Trader[] = [
  { id: 0, name: 'Prapor', avatarUrl: 'https://assets.tarkov.dev/prapor-icon.jpg' },
  { id: 1, name: 'Therapist', avatarUrl: 'https://assets.tarkov.dev/therapist-icon.jpg' },
  { id: 2, name: 'Skier', avatarUrl: 'https://assets.tarkov.dev/skier-icon.jpg' },
  { id: 3, name: 'Peacekeeper', avatarUrl: 'https://assets.tarkov.dev/peacekeeper-icon.jpg' },
  { id: 4, name: 'Mechanic', avatarUrl: 'https://assets.tarkov.dev/mechanic-icon.jpg' },
  { id: 5, name: 'Ragman', avatarUrl: 'https://assets.tarkov.dev/ragman-icon.jpg' },
  { id: 6, name: 'Jaeger', avatarUrl: 'https://assets.tarkov.dev/jaeger-icon.jpg' },
  { id: 7, name: 'Fence', avatarUrl: 'https://assets.tarkov.dev/fence-icon.jpg' },
];

export const MAPS: MapInfo[] = [
  { id: 'customs', name: 'Customs', normalizedName: 'customs', wiki: 'https://escapefromtarkov.fandom.com/wiki/Customs' },
  { id: 'woods', name: 'Woods', normalizedName: 'woods', wiki: 'https://escapefromtarkov.fandom.com/wiki/Woods' },
  { id: 'shoreline', name: 'Shoreline', normalizedName: 'shoreline', wiki: 'https://escapefromtarkov.fandom.com/wiki/Shoreline' },
  { id: 'interchange', name: 'Interchange', normalizedName: 'interchange', wiki: 'https://escapefromtarkov.fandom.com/wiki/Interchange' },
  { id: 'reserve', name: 'Reserve', normalizedName: 'reserve', wiki: 'https://escapefromtarkov.fandom.com/wiki/Reserve' },
  { id: 'lighthouse', name: 'Lighthouse', normalizedName: 'lighthouse', wiki: 'https://escapefromtarkov.fandom.com/wiki/Lighthouse' },
  { id: 'streets', name: 'Streets of Tarkov', normalizedName: 'streets-of-tarkov', wiki: 'https://escapefromtarkov.fandom.com/wiki/Streets_of_Tarkov' },
  { id: 'factory', name: 'Factory', normalizedName: 'factory', wiki: 'https://escapefromtarkov.fandom.com/wiki/Factory' },
  { id: 'labs', name: 'The Labs', normalizedName: 'the-labs', wiki: 'https://escapefromtarkov.fandom.com/wiki/The_Labs' },
  { id: 'ground-zero', name: 'Ground Zero', normalizedName: 'ground-zero', wiki: 'https://escapefromtarkov.fandom.com/wiki/Ground_Zero' },
];

export const LOCATION_MAP_NAMES: Record<number, string> = {
  0: 'factory',
  1: 'customs',
  2: 'woods',
  3: 'shoreline',
  4: 'interchange',
  5: 'reserve',
  6: 'lighthouse',
  7: 'streets',
  8: 'labs',
  9: 'ground-zero',
};

const GRAPHQL_QUERY = `
query GetTarkovData {
  tasks {
    id
    name
    normalizedName
    wikiLink
    minPlayerLevel
    trader {
      id
      name
      imageLink
    }
    map {
      id
      name
      normalizedName
    }
    objectives {
      id
      type
      description
      optional
      maps {
        id
        name
        normalizedName
      }
      zones {
        id
        map {
          id
          name
        }
        position {
          x
          y
          z
        }
      }
    }
  }
}
`;

export async function fetchQuestsData(): Promise<Quest[]> {
  // Load item-data.json for MongoID to readable item name resolution
  const itemMap = await loadItemData();

  // Load removed quests dictionary for filtering PvP removed/disabled quests
  let removedQuestMap: Record<string, string> = {};
  try {
    const removedRes = await fetch('/data/removed_quests.json');
    if (removedRes.ok) {
      removedQuestMap = await removedRes.json();
    }
  } catch (e) {
    console.warn('Could not load removed_quests.json, proceeding with default filter:', e);
  }

  const removedKeys = new Set(Object.keys(removedQuestMap));
  const removedTitles = new Set(Object.values(removedQuestMap).map((t) => t.toLowerCase()));

  const isQuestActiveInPVP = (id: string | number, gameId?: string, title?: string): boolean => {
    if (id && removedKeys.has(String(id))) return false;
    if (gameId && removedKeys.has(gameId)) return false;
    if (title && removedTitles.has(title.toLowerCase())) return false;
    return true;
  };

  try {
    // 1. Try GraphQL API (https://api.tarkov.dev/graphql)
    const response = await fetch('https://api.tarkov.dev/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: GRAPHQL_QUERY }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result?.data?.tasks && Array.isArray(result.data.tasks) && result.data.tasks.length > 0) {
        return result.data.tasks
          .filter((task: any) => isQuestActiveInPVP(task.id, task.id, task.name))
          .map((task: any) => ({
            id: task.id,
            title: task.name,
            minPlayerLevel: task.minPlayerLevel || 1,
            wiki: task.wikiLink,
            giver: {
              id: task.trader?.id || 'unknown',
              name: task.trader?.name || 'Unknown Trader',
              avatarUrl: task.trader?.imageLink,
            },
            map: task.map ? { id: task.map.id, name: task.map.name, normalizedName: task.map.normalizedName } : undefined,
            objectives: (task.objectives || []).map((obj: any) => ({
              id: obj.id,
              type: obj.type || 'objective',
              description: resolveItemName(obj.description, itemMap),
              optional: obj.optional,
              zones: obj.zones,
            })),
          }));
      }
    }
  } catch (e) {
    console.warn('Tarkov GraphQL endpoint fallback to local JSON data:', e);
  }

  // 2. Fallback to local quest-data.json
  const localRes = await fetch('/data/quest-data.json');
  if (!localRes.ok) {
    throw new Error('Failed to load local quest data');
  }

  const rawQuests = await localRes.json();
  return rawQuests
    .filter((q: any) => isQuestActiveInPVP(q.id, q.gameId, q.title))
    .map((q: any) => {
      const giverTrader = TRADERS.find((t) => t.id === q.giver) || { id: q.giver, name: `Trader ${q.giver}` };
      const mapName = q.objectives?.find((o: any) => o.location >= 0)?.location;
      const mapId = mapName !== undefined ? LOCATION_MAP_NAMES[mapName] : undefined;
      const matchedMap = mapId ? MAPS.find((m) => m.id === mapId) : undefined;

      return {
        id: q.id,
        gameId: q.gameId,
        title: q.title,
        locales: q.locales,
        wiki: q.wiki,
        giver: giverTrader,
        minPlayerLevel: q.require?.level || 1,
        map: matchedMap,
        exp: q.exp,
        objectives: (q.objectives || []).map((obj: any) => {
          const resolvedTarget = resolveItemName(obj.target, itemMap);
          const resolvedTool = resolveItemName(obj.tool, itemMap);
          const resolvedWith = obj.with ? resolveItemName(obj.with, itemMap) : undefined;

          // Generate human readable description
          let desc = obj.hint ? resolveItemName(obj.hint, itemMap) : '';
          if (!desc && resolvedTarget) {
            switch (obj.type) {
              case 'key':
                desc = `Obtain key: ${resolvedTarget}`;
                break;
              case 'pickup':
                desc = `Pickup: ${resolvedTarget}`;
                break;
              case 'place':
                desc = `Place item: ${resolvedTarget}`;
                break;
              case 'collect':
                desc = `Collect: ${resolvedTarget}${obj.number ? ` (${obj.number} pcs)` : ''}`;
                break;
              case 'find':
                desc = `Find in raid: ${resolvedTarget}${obj.number ? ` (${obj.number} pcs)` : ''}`;
                break;
              case 'mark':
                desc = `Mark ${resolvedTarget}${resolvedTool ? ` using ${resolvedTool}` : ''}`;
                break;
              case 'kill':
                desc = `Kill ${resolvedTarget}${obj.number ? ` (${obj.number})` : ''}${resolvedWith ? ` with ${resolvedWith}` : ''}`;
                break;
              default:
                desc = `${obj.type}: ${resolvedTarget}`;
            }
          }

          if (!desc) {
            desc = obj.type || 'Task objective';
          }

          return {
            id: obj.id,
            type: obj.type,
            description: desc,
            target: resolvedTarget,
            number: obj.number,
            location: obj.location,
            gps: obj.gps,
            hint: obj.hint,
            optional: obj.optional,
            tool: resolvedTool,
            with: resolvedWith,
          };
        }),
      };
    });
}
