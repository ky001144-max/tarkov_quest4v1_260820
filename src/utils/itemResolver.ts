let itemDataCache: Record<string, { id: string; name: string; shortname?: string }> | null = null;
let koLocaleCache: Record<string, string> | null = null;

const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

export async function loadItemData(): Promise<Record<string, { id: string; name: string; shortname?: string }>> {
  if (itemDataCache) return itemDataCache;

  try {
    const res = await fetch(`${BASE}data/item-data.json`);
    if (res.ok) {
      itemDataCache = await res.json();
      return itemDataCache || {};
    }
  } catch (e) {
    console.warn('Failed to load item-data.json:', e);
  }
  return {};
}

export async function loadKoLocale(): Promise<Record<string, string>> {
  if (koLocaleCache) return koLocaleCache;

  try {
    const res = await fetch(`${BASE}data/ko.json`);
    if (res.ok) {
      koLocaleCache = await res.json();
      return koLocaleCache || {};
    }
  } catch (e) {
    console.warn('Failed to load ko.json:', e);
  }
  return {};
}

/**
 * Resolves MongoId or item key strings to Korean or English readable item names
 */
export function resolveItemName(
  val: any,
  itemMap: Record<string, { id: string; name: string; shortname?: string }>,
  koLocale: Record<string, string> = {}
): string {
  if (!val) return '';

  if (Array.isArray(val)) {
    return val.map((item) => resolveItemName(item, itemMap, koLocale)).filter(Boolean).join(' / ');
  }

  if (typeof val === 'string') {
    // 1. Check Korean locale translation for item name (e.g. "5937ee6486f77408994ba448 Name")
    if (koLocale[val + ' Name']) {
      return koLocale[val + ' Name'];
    }
    if (koLocale[val]) {
      return koLocale[val];
    }

    // 2. Check item-data.json
    if (itemMap[val]) {
      return itemMap[val].name || itemMap[val].shortname || val;
    }

    // 3. Regex replace 24-hex MongoId substrings
    return val.replace(/\b[0-9a-fA-F]{24}\b/g, (match) => {
      if (koLocale[match + ' Name']) return koLocale[match + ' Name'];
      if (koLocale[match]) return koLocale[match];
      if (itemMap[match]) return itemMap[match].name || itemMap[match].shortname || match;
      return match;
    });
  }

  return String(val);
}

/**
 * Extract Korean Quest Title from ko.json or fallback
 */
export function getKoreanQuestTitle(gameId?: string, enTitle?: string, koLocale: Record<string, string> = {}): string {
  if (gameId && koLocale[gameId + ' description']) {
    const desc = koLocale[gameId + ' description'];
    const match = desc.match(/^\[(.*?)\]/);
    if (match) {
      // Clean brackets and English titles inside parenthesis e.g. "데뷔(Debut)" -> "데뷔"
      const cleaned = match[1].replace(/\(.*?\)/g, '').trim();
      if (cleaned) return cleaned;
    }
  }
  if (gameId && koLocale[gameId]) {
    return koLocale[gameId];
  }
  return enTitle || '퀘스트';
}

/**
 * Format Objective description into natural Korean
 */
export function formatKoreanObjective(
  obj: any,
  itemMap: Record<string, any>,
  koLocale: Record<string, string>
): string {
  // Check direct Korean locale for objective string ID if available
  if (obj.gameId && koLocale[obj.gameId]) {
    return koLocale[obj.gameId];
  }
  if (obj.id && koLocale[obj.id]) {
    return koLocale[obj.id];
  }

  const targetName = resolveItemName(obj.target, itemMap, koLocale);
  const toolName = resolveItemName(obj.tool, itemMap, koLocale);
  const withItems = obj.with ? resolveItemName(obj.with, itemMap, koLocale) : undefined;
  const countStr = obj.number ? ` (${obj.number}개)` : '';

  let desc = obj.hint ? resolveItemName(obj.hint, itemMap, koLocale) : '';

  switch (obj.type) {
    case 'key':
      return `🔑 [열쇠 획득] ${targetName || '필요한 열쇠'} 획득하기`;
    case 'pickup':
      return `📦 [아이템 회수] ${targetName || desc || '목표 아이템'} 획득하기`;
    case 'place':
      return `📍 [아이템 설치] ${targetName || desc || '목표 지점'}에 물품 배치하기`;
    case 'collect':
      return `🎒 [수집 및 건네주기] ${targetName}${countStr} 전달하기`;
    case 'find':
      return `🔍 [레이드에서 획득] ${targetName}${countStr} 찾아오기`;
    case 'mark':
      return `🏷️ [위치 마킹] ${targetName || desc || '목표 구역'} 마킹하기${toolName ? ` (${toolName} 사용)` : ''}`;
    case 'kill':
      return `🎯 [적 처치] ${targetName || '스캐브/PMC'}${obj.number ? ` ${obj.number}명` : ''} 처치하기${withItems ? ` (${withItems} 사용)` : ''}`;
    case 'locate':
    case 'visit':
      return `🧭 [지역 탐색] ${targetName || desc || '목표 위치'} 방문하기`;
    case 'reputation':
      return `🤝 [상인 우호도] ${targetName || '상인'} 우호도 달성하기`;
    case 'skill':
      return `⚡ [스킬 레벨] ${targetName || '해당'} 스킬 레벨 달성하기`;
    default:
      return desc || `${obj.type}: ${targetName || '목표 수행'}`;
  }
}
