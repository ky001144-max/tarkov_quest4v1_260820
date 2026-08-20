let itemDataCache: Record<string, { id: string; name: string; shortname?: string }> | null = null;

export async function loadItemData(): Promise<Record<string, { id: string; name: string; shortname?: string }>> {
  if (itemDataCache) return itemDataCache;

  try {
    const res = await fetch('/data/item-data.json');
    if (res.ok) {
      itemDataCache = await res.json();
      return itemDataCache || {};
    }
  } catch (e) {
    console.warn('Failed to load item-data.json for item name resolution:', e);
  }
  return {};
}

/**
 * Resolves MongoId or item key strings (e.g. "5937ee6486f77408994ba448") to readable item names ("Machinery key")
 */
export function resolveItemName(
  val: any,
  itemMap: Record<string, { id: string; name: string; shortname?: string }>
): string {
  if (!val) return '';

  if (Array.isArray(val)) {
    return val.map((item) => resolveItemName(item, itemMap)).filter(Boolean).join(' / ');
  }

  if (typeof val === 'string') {
    // Exact MongoId match
    if (itemMap[val]) {
      return itemMap[val].name || itemMap[val].shortname || val;
    }

    // Replace MongoId 24-hex-character substrings inside text
    return val.replace(/\b[0-9a-fA-F]{24}\b/g, (match) => {
      if (itemMap[match]) {
        return itemMap[match].name || itemMap[match].shortname || match;
      }
      return match;
    });
  }

  return String(val);
}
